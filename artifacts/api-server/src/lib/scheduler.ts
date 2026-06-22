import { and, eq, lt, ne } from "drizzle-orm";
import { db, bookingsTable, bookingHistoryTable, experiencesTable, usersTable } from "@workspace/db";
import { sendEmail, emailTemplates } from "./emailService";
import { logger } from "./logger";

const PAYMENT_DEADLINE_DAYS = 7;

async function cancelExpiredBookings() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PAYMENT_DEADLINE_DAYS);

  // Find approved-but-unpaid bookings older than the deadline.
  const expired = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.status, "approved"),
        eq(bookingsTable.paymentStatus, "pending"),
        lt(bookingsTable.createdAt, cutoff),
      ),
    );

  if (expired.length === 0) return;

  logger.info({ count: expired.length }, "[scheduler] Auto-cancelling expired unpaid bookings");

  for (const booking of expired) {
    try {
      await db
        .update(bookingsTable)
        .set({ status: "cancelled", cancellationReason: "Payment not received within 7 days" })
        .where(and(eq(bookingsTable.id, booking.id), ne(bookingsTable.status, "cancelled")));

      await db.insert(bookingHistoryTable).values({
        bookingId: booking.id,
        status: "cancelled",
        note: "Auto-cancelled: payment deadline of 7 days exceeded",
        changedBy: null,
      });

      const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId));
      const [exp] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId));

      if (customer?.email && exp) {
        sendEmail({
          to: customer.email,
          toName: customer.name,
          subject: `Booking Cancelled: ${exp.title} — Payment deadline passed`,
          html: emailTemplates.bookingCancelled({
            customerName: customer.name,
            experienceTitle: exp.title,
            date: booking.date,
            bookingId: booking.id,
          }),
          template: "booking_cancelled",
          userId: booking.userId,
        }).catch(err => logger.error({ err, bookingId: booking.id }, "[scheduler] cancellation email error"));
      }
    } catch (err) {
      logger.error({ err, bookingId: booking.id }, "[scheduler] failed to auto-cancel booking");
    }
  }
}

export function startScheduler() {
  // Run once at startup, then every 6 hours.
  cancelExpiredBookings().catch(err => logger.error({ err }, "[scheduler] initial run error"));
  setInterval(() => {
    cancelExpiredBookings().catch(err => logger.error({ err }, "[scheduler] run error"));
  }, 6 * 60 * 60 * 1000);
}
