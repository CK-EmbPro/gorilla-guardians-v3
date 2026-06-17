import { Router, type IRouter } from "express";
import { eq, and, ne, sum, inArray, asc } from "drizzle-orm";
import { z } from "zod";
import {
  db, experiencePackagesTable, experiencePackageItemsTable, experiencesTable,
  bookingsTable, bookingHistoryTable, usersTable,
} from "@workspace/db";
import { createNotification, notifyAdmins } from "../lib/notificationHelper";

const ExperiencePackageInputSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  images: z.array(z.string()).optional().default([]),
  price: z.number(),
  discountPercent: z.number().optional().default(0),
  active: z.boolean().optional().default(true),
  experienceIds: z.array(z.number()),
});

const PackageBookingInputSchema = z.object({
  date: z.string(),
  participants: z.number().int().min(1),
  specialRequests: z.string().optional(),
});
import { sendEmail, emailTemplates } from "../lib/emailService";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function generatePackageBookingReference(): string {
  return "PKG-" + randomBytes(4).toString("hex").toUpperCase();
}

async function buildPackage(pkg: typeof experiencePackagesTable.$inferSelect) {
  const items = await db.select().from(experiencePackageItemsTable)
    .where(eq(experiencePackageItemsTable.packageId, pkg.id))
    .orderBy(asc(experiencePackageItemsTable.sortOrder));
  const experienceIds = items.map(i => i.experienceId);
  const experiences = experienceIds.length > 0
    ? await db.select().from(experiencesTable).where(inArray(experiencesTable.id, experienceIds))
    : [];
  // Preserve the package's configured display order, not whatever order the IN-query returned.
  const ordered = experienceIds
    .map(id => experiences.find(e => e.id === id))
    .filter((e): e is typeof experiencesTable.$inferSelect => !!e);

  return {
    ...pkg,
    discountPercent: Number(pkg.discountPercent),
    price: Number(pkg.price),
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: undefined,
    experiences: ordered.map(e => ({
      id: e.id, title: e.title, slug: e.slug, description: e.description, type: e.type,
      images: e.images, videoUrl: e.videoUrl ?? null, price: Number(e.price), duration: e.duration,
      capacity: e.capacity, difficultyLevel: e.difficultyLevel ?? null, includedItems: e.includedItems,
      meetingPoint: e.meetingPoint ?? null, cancellationPolicy: e.cancellationPolicy ?? null,
      active: e.active, averageRating: null, reviewCount: 0, createdAt: e.createdAt.toISOString(),
    })),
  };
}

router.get("/packages", async (_req, res): Promise<void> => {
  const packages = await db.select().from(experiencePackagesTable).where(eq(experiencePackagesTable.active, true));
  res.json(await Promise.all(packages.map(buildPackage)));
});

router.post("/packages", async (req, res): Promise<void> => {
  const parsed = ExperiencePackageInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const experiences = await db.select().from(experiencesTable).where(inArray(experiencesTable.id, parsed.data.experienceIds));
  if (experiences.length !== parsed.data.experienceIds.length) {
    res.status(404).json({ error: "One or more experienceIds were not found" });
    return;
  }

  const slug = parsed.data.title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  const [pkg] = await db.insert(experiencePackagesTable).values({
    title: parsed.data.title,
    description: parsed.data.description,
    slug,
    images: parsed.data.images ?? [],
    price: parsed.data.price,
    discountPercent: parsed.data.discountPercent ?? 0,
    active: parsed.data.active ?? true,
  }).returning();

  for (let i = 0; i < parsed.data.experienceIds.length; i++) {
    await db.insert(experiencePackageItemsTable).values({ packageId: pkg.id, experienceId: parsed.data.experienceIds[i], sortOrder: i });
  }

  res.status(201).json(await buildPackage(pkg));
});

router.get("/packages/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [pkg] = await db.select().from(experiencePackagesTable).where(eq(experiencePackagesTable.id, id));
  if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }
  res.json(await buildPackage(pkg));
});

router.patch("/packages/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ExperiencePackageInputSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { experienceIds, ...rest } = parsed.data;
  const [pkg] = await db.update(experiencePackagesTable).set(rest as any).where(eq(experiencePackagesTable.id, id)).returning();
  if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }

  if (experienceIds) {
    await db.delete(experiencePackageItemsTable).where(eq(experiencePackageItemsTable.packageId, id));
    for (let i = 0; i < experienceIds.length; i++) {
      await db.insert(experiencePackageItemsTable).values({ packageId: id, experienceId: experienceIds[i], sortOrder: i });
    }
  }

  res.json(await buildPackage(pkg));
});

// POST /packages/:id/book — books every experience in the package for the same date, sharing one
// packageBookingRef. Reuses the exact capacity-check logic from routes/bookings.ts so a package
// can never overbook an experience that's also bookable individually.
router.post("/packages/:id/book", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = PackageBookingInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [pkg] = await db.select().from(experiencePackagesTable).where(eq(experiencePackagesTable.id, id));
  if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }

  const items = await db.select().from(experiencePackageItemsTable)
    .where(eq(experiencePackageItemsTable.packageId, id))
    .orderBy(asc(experiencePackageItemsTable.sortOrder));
  if (items.length === 0) { res.status(400).json({ error: "Package has no experiences configured" }); return; }

  const experiences = await db.select().from(experiencesTable).where(inArray(experiencesTable.id, items.map(i => i.experienceId)));

  // Validate capacity for every included experience before creating any booking, so a partial
  // failure can't leave the package half-booked.
  for (const exp of experiences) {
    const bookedResult = await db
      .select({ total: sum(bookingsTable.participants) })
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.experienceId, exp.id),
        eq(bookingsTable.date, parsed.data.date),
        ne(bookingsTable.status, "cancelled"),
      ));
    const alreadyBooked = Number(bookedResult[0]?.total ?? 0);
    const remaining = exp.capacity - alreadyBooked;
    if (parsed.data.participants > remaining) {
      res.status(400).json({
        error: `Not enough capacity for "${exp.title}". Only ${remaining} spot${remaining !== 1 ? "s" : ""} remaining for this date.`,
        experienceId: exp.id,
        remainingCapacity: remaining,
      });
      return;
    }
  }

  const userId = (req.session as any).userId ?? 1;
  const packageBookingRef = generatePackageBookingReference();
  const perExperienceAmount = (pkg.price * (1 - Number(pkg.discountPercent) / 100)) / experiences.length;

  const createdBookings = [];
  for (const exp of experiences) {
    const [booking] = await db.insert(bookingsTable).values({
      bookingReference: "GG-" + randomBytes(4).toString("hex").toUpperCase(),
      userId,
      experienceId: exp.id,
      date: parsed.data.date,
      participants: parsed.data.participants,
      totalAmount: perExperienceAmount,
      status: "pending",
      paymentStatus: "pending",
      specialRequests: parsed.data.specialRequests ?? null,
      packageBookingRef,
    }).returning();
    await db.insert(bookingHistoryTable).values({ bookingId: booking.id, status: "pending", note: `Booked as part of package "${pkg.title}"`, changedBy: userId });
    createdBookings.push(booking);
  }

  await createNotification({
    userId,
    type: "booking",
    title: "Package Booking Submitted!",
    message: `Your booking for "${pkg.title}" on ${parsed.data.date} has been submitted. Reference: ${packageBookingRef}`,
    link: `/bookings?packageRef=${packageBookingRef}`,
  });
  await notifyAdmins({
    type: "booking",
    title: "New Package Booking",
    message: `New package booking ${packageBookingRef} for "${pkg.title}" on ${parsed.data.date}`,
    link: `/admin/bookings`,
  });

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (customer?.email) {
    sendEmail({
      to: customer.email,
      toName: customer.name,
      subject: `Package Booking Confirmed: ${pkg.title} — Ref ${packageBookingRef}`,
      html: emailTemplates.packageBookingConfirmation({
        customerName: customer.name,
        packageTitle: pkg.title,
        date: parsed.data.date,
        participants: parsed.data.participants,
        totalAmount: pkg.price * (1 - Number(pkg.discountPercent) / 100),
        experienceTitles: experiences.map(e => e.title),
        packageBookingRef,
      }),
      template: "package_booking_confirmation",
      userId,
      metadata: { packageBookingRef, packageId: pkg.id },
    }).catch(err => console.error("[packages] email error:", err));
  }

  res.status(201).json({ packageBookingRef, bookings: createdBookings });
});

export default router;
