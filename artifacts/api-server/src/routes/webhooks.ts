import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, bookingsTable, usersTable, experiencesTable, bookingHistoryTable } from "@workspace/db";
import { getStripeClient } from "../lib/stripeService";
import { sendEmail, emailTemplates } from "../lib/emailService";
import type Stripe from "stripe";

const router: IRouter = Router();

// Stripe requires the *exact* raw request bytes to verify the webhook signature. app.ts captures
// them into `req.rawBody` via express.json()'s `verify` callback (rather than swapping in
// express.raw() for this one path, which would otherwise risk the body being read twice and
// arriving empty — see app.ts comment).
router.post("/webhooks/stripe", async (req, res): Promise<void> => {
  const signature = req.headers["stripe-signature"];
  const rawBody = (req as any).rawBody as Buffer | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[webhooks/stripe] STRIPE_WEBHOOK_SECRET is not configured");
    res.status(500).json({ error: "Webhook not configured" });
    return;
  }
  if (!signature || !rawBody) {
    res.status(400).json({ error: "Missing Stripe signature or raw body" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[webhooks/stripe] signature verification failed:", err);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const kind = session.metadata?.kind;

      if (kind === "order") {
        await handleOrderPaid(session);
      } else if (kind === "booking") {
        await handleBookingPaid(session);
      }
    } else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === "booking") {
        await handleBookingPaymentFailed(session);
      }
    }
  } catch (err) {
    console.error("[webhooks/stripe] handler error:", err);
    // Still 200 — Stripe retries on non-2xx, and a handler bug shouldn't cause Stripe to hammer
    // the endpoint indefinitely. The event is logged above for manual follow-up.
  }

  res.json({ received: true });
});

async function handleOrderPaid(session: Stripe.Checkout.Session) {
  const orderId = Number(session.metadata?.orderId);
  if (!orderId || Number.isNaN(orderId)) return;

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return;
  // Idempotency: webhooks can be delivered more than once for the same event.
  if (order.paymentStatus === "paid") return;

  await db.update(ordersTable).set({
    paymentStatus: "paid",
    stripeSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
  }).where(eq(ordersTable.id, orderId));

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));
  if (customer?.email) {
    sendEmail({
      to: customer.email,
      toName: customer.name,
      subject: `Payment Received — Order #${order.id}`,
      html: emailTemplates.paymentSuccessful({
        customerName: customer.name,
        orderId: order.id,
        amount: Number(order.total),
        paymentRef: session.id,
      }),
      template: "payment_successful",
      userId: order.userId,
    }).catch(err => console.error("[webhooks/stripe] order payment email error:", err));
  }
}

async function handleBookingPaid(session: Stripe.Checkout.Session) {
  const bookingId = Number(session.metadata?.bookingId);
  if (!bookingId || Number.isNaN(bookingId)) return;

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
  if (!booking) return;
  if (booking.paymentStatus === "paid") return;

  // B1: Auto-confirm on payment — no manual confirm step needed once paid.
  await db.update(bookingsTable).set({
    paymentStatus: "paid",
    status: "confirmed",
    stripeSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
  }).where(eq(bookingsTable.id, bookingId));

  await db.insert(bookingHistoryTable).values({
    bookingId: booking.id,
    status: "confirmed",
    note: "Payment received via Stripe — booking auto-confirmed",
    changedBy: null,
  });

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId));
  const [exp] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId));
  if (customer?.email && exp) {
    sendEmail({
      to: customer.email,
      toName: customer.name,
      subject: `Confirmed & Paid: ${exp.title} — Ref ${booking.bookingReference}`,
      html: emailTemplates.bookingPaymentConfirmed({
        customerName: customer.name,
        experienceTitle: exp.title,
        date: booking.date,
        amount: Number(booking.totalAmount),
        bookingReference: booking.bookingReference,
      }),
      template: "booking_payment_confirmed",
      userId: booking.userId,
    }).catch(err => console.error("[webhooks/stripe] booking payment email error:", err));
  }
}

async function handleBookingPaymentFailed(session: Stripe.Checkout.Session) {
  const bookingId = Number(session.metadata?.bookingId);
  if (!bookingId || Number.isNaN(bookingId)) return;

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
  if (!booking) return;

  await db.insert(bookingHistoryTable).values({
    bookingId: booking.id,
    status: booking.status,
    note: "Stripe async payment failed — customer notified to retry",
    changedBy: null,
  });

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId));
  const [exp] = await db.select().from(experiencesTable).where(eq(experiencesTable.id, booking.experienceId));
  if (customer?.email && exp) {
    sendEmail({
      to: customer.email,
      toName: customer.name,
      subject: `Payment Failed: ${exp.title} — Action Required`,
      html: emailTemplates.bookingPaymentFailed({
        customerName: customer.name,
        experienceTitle: exp.title,
        date: booking.date,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
      }),
      template: "booking_payment_failed",
      userId: booking.userId,
    }).catch(err => console.error("[webhooks/stripe] booking payment failed email error:", err));
  }
}

export default router;
