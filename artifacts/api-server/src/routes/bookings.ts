import { Router, type IRouter } from "express";
import { eq, and, desc, sum, ne } from "drizzle-orm";
import { db, bookingsTable, experiencesTable, usersTable, guidesTable, bookingHistoryTable } from "@workspace/db";
import {
  ListBookingsQueryParams,
  GetBookingParams,
  CreateBookingBody,
  UpdateBookingBody,
  UpdateBookingParams,
} from "@workspace/api-zod";
import { createNotification, notifyAdmins } from "../lib/notificationHelper";
import { sendEmail, emailTemplates } from "../lib/emailService";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function generateBookingReference(): string {
  return "GG-" + randomBytes(4).toString("hex").toUpperCase();
}

async function buildBooking(booking: typeof bookingsTable.$inferSelect) {
  const [exp] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId));
  const [user] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone, avatar: usersTable.avatar }).from(usersTable).where(eq(usersTable.id, booking.userId));

  let guide = null;
  if (booking.guideId) {
    const [g] = await db.select().from(guidesTable).where(eq(guidesTable.id, booking.guideId));
    if (g) guide = { ...g, rating: Number(g.rating) };
  }

  const history = await db.select().from(bookingHistoryTable)
    .where(eq(bookingHistoryTable.bookingId, booking.id))
    .orderBy(desc(bookingHistoryTable.createdAt));

  return {
    ...booking,
    totalAmount: Number(booking.totalAmount),
    specialRequests: booking.specialRequests ?? null,
    bookingReference: booking.bookingReference ?? null,
    qrCodeData: booking.qrCodeData ?? null,
    checkinAt: booking.checkinAt ? booking.checkinAt.toISOString() : null,
    cancellationReason: booking.cancellationReason ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: undefined,
    guide,
    history: history.map(h => ({
      id: h.id,
      status: h.status,
      note: h.note ?? null,
      changedBy: h.changedBy ?? null,
      createdAt: h.createdAt.toISOString(),
    })),
    user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone ?? null, avatar: user.avatar ?? null } : null,
    experience: exp ? {
      id: exp.id, title: exp.title, slug: exp.slug, description: exp.description,
      type: exp.type, images: exp.images, videoUrl: exp.videoUrl ?? null,
      price: Number(exp.price), duration: exp.duration, capacity: exp.capacity,
      difficultyLevel: exp.difficultyLevel ?? null, includedItems: exp.includedItems,
      meetingPoint: exp.meetingPoint ?? null, cancellationPolicy: exp.cancellationPolicy ?? null,
      active: exp.active, averageRating: null, reviewCount: 0, createdAt: exp.createdAt.toISOString(),
    } : undefined,
  };
}

// GET /bookings
router.get("/bookings", async (req, res): Promise<void> => {
  const params = ListBookingsQueryParams.safeParse(req.query);
  const conditions: any[] = [];
  if (params.success) {
    if (params.data.userId) conditions.push(eq(bookingsTable.userId, Number(params.data.userId)));
    if (params.data.status) conditions.push(eq(bookingsTable.status, params.data.status));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const bookings = await db.select().from(bookingsTable).where(where).orderBy(desc(bookingsTable.createdAt));
  const rich = await Promise.all(bookings.map(buildBooking));

  const search = req.query.search as string | undefined;
  const filtered = search
    ? rich.filter(b =>
        b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        b.experience?.title?.toLowerCase().includes(search.toLowerCase()) ||
        String(b.id).includes(search) ||
        (b.bookingReference ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : rich;

  res.json(filtered);
});

// POST /bookings
router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const userId = (req.session as any).userId ?? 1;
  const [exp] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, parsed.data.experienceId));
  if (!exp) { res.status(404).json({ error: "Experience not found" }); return; }

  // Capacity validation
  const bookedResult = await db
    .select({ total: sum(bookingsTable.participants) })
    .from(bookingsTable)
    .where(and(
      eq(bookingsTable.experienceId, parsed.data.experienceId),
      eq(bookingsTable.date, parsed.data.date),
      ne(bookingsTable.status, "cancelled"),
    ));
  const alreadyBooked = Number(bookedResult[0]?.total ?? 0);
  const remaining = exp.capacity - alreadyBooked;
  if (parsed.data.participants > remaining) {
    res.status(400).json({
      error: `Not enough capacity. Only ${remaining} spot${remaining !== 1 ? "s" : ""} remaining for this date.`,
      remainingCapacity: remaining,
    });
    return;
  }

  const totalAmount = Number(exp.price) * parsed.data.participants;
  const bookingReference = generateBookingReference();
  const qrCodeData = `${process.env.APP_URL ?? "https://gorillaguardians.rw"}/booking-verify?ref=${bookingReference}`;

  const [booking] = await db.insert(bookingsTable).values({
    bookingReference,
    userId,
    experienceId: parsed.data.experienceId,
    date: parsed.data.date,
    participants: parsed.data.participants,
    totalAmount,
    status: "pending",
    paymentStatus: "pending",
    specialRequests: parsed.data.specialRequests ?? null,
    qrCodeData,
  }).returning();

  // Create initial history entry
  await db.insert(bookingHistoryTable).values({
    bookingId: booking.id,
    status: "pending",
    note: "Booking submitted",
    changedBy: userId,
  });

  await createNotification({
    userId,
    type: "booking",
    title: "Booking Submitted!",
    message: `Your booking for "${exp.title}" on ${parsed.data.date} has been submitted. Reference: ${bookingReference}`,
    link: `/bookings/${booking.id}`,
  });

  await notifyAdmins({
    type: "booking",
    title: "New Booking",
    message: `New booking ${bookingReference} for "${exp.title}" on ${parsed.data.date} (${parsed.data.participants} participant${parsed.data.participants !== 1 ? "s" : ""})`,
    link: `/admin/bookings`,
  });

  // Send booking confirmation email
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (customer?.email) {
    sendEmail({
      to: customer.email,
      toName: customer.name,
      subject: `Booking Confirmed: ${exp.title} — Ref ${bookingReference}`,
      html: emailTemplates.bookingConfirmation({
        customerName: customer.name,
        experienceTitle: exp.title,
        date: parsed.data.date,
        participants: parsed.data.participants,
        totalAmount,
        bookingId: booking.id,
      }),
      template: "booking_confirmation",
      userId,
      metadata: { bookingId: booking.id, bookingReference, experienceId: exp.id },
    }).catch(err => console.error("[bookings] email error:", err));
  }

  res.status(201).json(await buildBooking(booking));
});

// GET /bookings/capacity — MUST be before /:id
router.get("/bookings/capacity", async (req, res): Promise<void> => {
  const { experienceId, date } = req.query;
  if (!experienceId || !date) { res.status(400).json({ error: "experienceId and date required" }); return; }
  const expIdNum = Number(experienceId);
  if (isNaN(expIdNum)) { res.status(400).json({ error: "Invalid experienceId" }); return; }
  const [exp] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, expIdNum));
  if (!exp) { res.status(404).json({ error: "Experience not found" }); return; }
  const bookedResult = await db
    .select({ total: sum(bookingsTable.participants) })
    .from(bookingsTable)
    .where(and(
      eq(bookingsTable.experienceId, expIdNum),
      eq(bookingsTable.date, String(date)),
      ne(bookingsTable.status, "cancelled"),
    ));
  const booked = Number(bookedResult[0]?.total ?? 0);
  res.json({ capacity: exp.capacity, booked, remaining: exp.capacity - booked });
});

// GET /bookings/ref/:ref — MUST be before /:id
router.get("/bookings/ref/:ref", async (req, res): Promise<void> => {
  const ref = req.params.ref;
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.bookingReference, ref));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  res.json(await buildBooking(booking));
});

// POST /bookings/verify — MUST be before /:id checkin
router.post("/bookings/verify", async (req, res): Promise<void> => {
  const { ref } = req.body;
  if (!ref) { res.status(400).json({ error: "ref is required" }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.bookingReference, ref));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  res.json(await buildBooking(booking));
});

// GET /bookings/:id
router.get("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  res.json(await buildBooking(booking));
});

// PATCH /bookings/:id
router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [prevBooking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  const [booking] = await db.update(bookingsTable).set(parsed.data as any).where(eq(bookingsTable.id, params.data.id)).returning();
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }

  const changedBy = (req.session as any)?.userId ?? null;

  if (parsed.data.status && prevBooking && parsed.data.status !== prevBooking.status) {
    // Log history
    await db.insert(bookingHistoryTable).values({
      bookingId: booking.id,
      status: parsed.data.status,
      note: `Status changed to ${parsed.data.status}`,
      changedBy,
    });

    const statusMessages: Record<string, string> = {
      approved: "Your booking has been approved! Check your email for details.",
      confirmed: "Your booking is confirmed! We look forward to seeing you.",
      cancelled: "Your booking has been cancelled.",
      completed: "Your experience is complete. We hope you loved it!",
      checked_in: "Visitor checked in successfully.",
      pending: "Your booking is pending review.",
    };
    await createNotification({
      userId: booking.userId,
      type: "booking",
      title: `Booking ${parsed.data.status.charAt(0).toUpperCase() + parsed.data.status.slice(1)}`,
      message: statusMessages[parsed.data.status] ?? `Your booking status changed to ${parsed.data.status}`,
      link: `/bookings/${booking.id}`,
    });

    const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId));
    const [exp] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId));
    if (customer?.email && exp) {
      if (parsed.data.status === "approved" || parsed.data.status === "confirmed") {
        sendEmail({
          to: customer.email,
          toName: customer.name,
          subject: `Booking Approved: ${exp.title} — Ref ${booking.bookingReference}`,
          html: emailTemplates.bookingApproved({
            customerName: customer.name,
            experienceTitle: exp.title,
            date: booking.date,
            participants: booking.participants,
            bookingId: booking.id,
          }),
          template: "booking_approved",
          userId: booking.userId,
        }).catch(err => console.error("[bookings] email error:", err));
      } else if (parsed.data.status === "cancelled") {
        sendEmail({
          to: customer.email,
          toName: customer.name,
          subject: `Booking Cancelled: ${exp.title}`,
          html: emailTemplates.bookingCancelled({
            customerName: customer.name,
            experienceTitle: exp.title,
            date: booking.date,
            bookingId: booking.id,
          }),
          template: "booking_cancelled",
          userId: booking.userId,
        }).catch(err => console.error("[bookings] email error:", err));
      }
    }
  }

  res.json(await buildBooking(booking));
});

// POST /bookings/:id/checkin — QR check-in
router.post("/bookings/:id/checkin", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  if (booking.checkinAt) {
    res.status(409).json({ error: "Already checked in", checkinAt: booking.checkinAt.toISOString() });
    return;
  }
  if (booking.status === "cancelled") {
    res.status(400).json({ error: "Cannot check in a cancelled booking" });
    return;
  }
  const changedBy = (req.session as any)?.userId ?? null;
  const [updated] = await db.update(bookingsTable).set({
    checkinAt: new Date(),
    status: "checked_in",
  }).where(eq(bookingsTable.id, id)).returning();

  await db.insert(bookingHistoryTable).values({
    bookingId: id,
    status: "checked_in",
    note: "Visitor checked in via QR code",
    changedBy,
  });

  await createNotification({
    userId: booking.userId,
    type: "booking",
    title: "Checked In!",
    message: "You have been successfully checked in. Enjoy your experience!",
    link: `/bookings/${id}`,
  });

  res.json({ success: true, checkinAt: updated.checkinAt?.toISOString(), booking: await buildBooking(updated) });
});

// POST /bookings/:id/reschedule
router.post("/bookings/:id/reschedule", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { date, participants, reason } = req.body;
  if (!date) { res.status(400).json({ error: "date is required" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  if (booking.status === "cancelled" || booking.status === "completed" || booking.status === "checked_in") {
    res.status(400).json({ error: `Cannot reschedule a ${booking.status} booking` });
    return;
  }

  const [exp] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId));
  if (!exp) { res.status(404).json({ error: "Experience not found" }); return; }

  const newParticipants = participants ?? booking.participants;

  // Capacity check for new date
  const bookedResult = await db
    .select({ total: sum(bookingsTable.participants) })
    .from(bookingsTable)
    .where(and(
      eq(bookingsTable.experienceId, booking.experienceId),
      eq(bookingsTable.date, date),
      ne(bookingsTable.status, "cancelled"),
      ne(bookingsTable.id, id),
    ));
  const alreadyBooked = Number(bookedResult[0]?.total ?? 0);
  const remaining = exp.capacity - alreadyBooked;
  if (newParticipants > remaining) {
    res.status(400).json({ error: `Not enough capacity on new date. Only ${remaining} spot${remaining !== 1 ? "s" : ""} remaining.`, remainingCapacity: remaining });
    return;
  }

  const newTotal = Number(exp.price) * newParticipants;
  const changedBy = (req.session as any)?.userId ?? null;

  const [updated] = await db.update(bookingsTable).set({
    date,
    participants: newParticipants,
    totalAmount: newTotal,
    rescheduledFrom: booking.id,
    status: "pending",
  }).where(eq(bookingsTable.id, id)).returning();

  await db.insert(bookingHistoryTable).values({
    bookingId: id,
    status: "pending",
    note: `Rescheduled to ${date}${reason ? ` — ${reason}` : ""}`,
    changedBy,
  });

  await createNotification({
    userId: booking.userId,
    type: "booking",
    title: "Booking Rescheduled",
    message: `Your booking for "${exp.title}" has been rescheduled to ${date}. Awaiting re-confirmation.`,
    link: `/bookings/${id}`,
  });

  res.json(await buildBooking(updated));
});

// PATCH /bookings/:id/guide — assign guide
router.patch("/bookings/:id/guide", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { guideId } = req.body;
  const [updated] = await db.update(bookingsTable)
    .set({ guideId: guideId ?? null })
    .where(eq(bookingsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }

  const changedBy = (req.session as any)?.userId ?? null;
  const guideName = guideId ? (await db.select({ name: guidesTable.name }).from(guidesTable).where(eq(guidesTable.id, guideId)))[0]?.name : null;

  await db.insert(bookingHistoryTable).values({
    bookingId: id,
    status: updated.status,
    note: guideId ? `Guide assigned: ${guideName ?? `#${guideId}`}` : "Guide unassigned",
    changedBy,
  });

  res.json(await buildBooking(updated));
});

// GET /bookings/:id/ticket — ticket data
router.get("/bookings/:id/ticket", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  const rich = await buildBooking(booking);
  res.json({
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    qrCodeData: booking.qrCodeData,
    status: booking.status,
    date: booking.date,
    participants: booking.participants,
    totalAmount: Number(booking.totalAmount),
    paymentStatus: booking.paymentStatus,
    checkinAt: booking.checkinAt?.toISOString() ?? null,
    customer: rich.user,
    experience: rich.experience,
    guide: rich.guide,
    issuedAt: new Date().toISOString(),
  });
});

export default router;
