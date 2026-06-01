import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, bookingsTable, experiencesTable } from "@workspace/db";
import {
  ListBookingsQueryParams,
  GetBookingParams,
  CreateBookingBody,
  UpdateBookingBody,
  UpdateBookingParams,
} from "@workspace/api-zod";
import { createNotification, notifyAdmins } from "../lib/notificationHelper";

const router: IRouter = Router();

async function buildBooking(booking: typeof bookingsTable.$inferSelect) {
  const [exp] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId));
  return {
    ...booking,
    totalAmount: Number(booking.totalAmount),
    specialRequests: booking.specialRequests ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: undefined,
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
  res.json(rich);
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const userId = (req.session as any).userId ?? 1;
  const [exp] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, parsed.data.experienceId));
  if (!exp) { res.status(404).json({ error: "Experience not found" }); return; }
  const totalAmount = Number(exp.price) * parsed.data.participants;
  const [booking] = await db.insert(bookingsTable).values({
    userId,
    experienceId: parsed.data.experienceId,
    date: parsed.data.date,
    participants: parsed.data.participants,
    totalAmount,
    status: "pending",
    paymentStatus: "pending",
    specialRequests: parsed.data.specialRequests ?? null,
  }).returning();

  // Notify customer
  await createNotification({
    userId,
    type: "booking",
    title: "Booking Confirmed!",
    message: `Your booking for "${exp.title}" on ${parsed.data.date} is confirmed.`,
    link: `/customer/bookings`,
  });

  // Notify admins
  await notifyAdmins({
    type: "booking",
    title: "New Booking",
    message: `A new booking was made for "${exp.title}" on ${parsed.data.date} (${parsed.data.participants} participant${parsed.data.participants !== 1 ? "s" : ""})`,
    link: `/admin/experiences`,
  });

  res.status(201).json(await buildBooking(booking));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  res.json(await buildBooking(booking));
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [prevBooking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  const [booking] = await db.update(bookingsTable).set(parsed.data as any).where(eq(bookingsTable.id, params.data.id)).returning();
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }

  // Notify on status change
  if (parsed.data.status && prevBooking && parsed.data.status !== prevBooking.status) {
    const statusMessages: Record<string, string> = {
      confirmed: "Your booking has been confirmed!",
      cancelled: "Your booking has been cancelled.",
      completed: "Your experience is complete. Thank you!",
      pending: "Your booking is pending review.",
    };
    await createNotification({
      userId: booking.userId,
      type: "booking",
      title: `Booking ${parsed.data.status.charAt(0).toUpperCase() + parsed.data.status.slice(1)}`,
      message: statusMessages[parsed.data.status] ?? `Your booking status changed to ${parsed.data.status}`,
      link: `/customer/bookings`,
    });
  }

  res.json(await buildBooking(booking));
});

export default router;
