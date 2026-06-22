import { db, emailLogsTable } from "@workspace/db";

const BASE_URL = process.env.APP_URL ?? "https://gorilla-guardians.replit.app";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Gorilla Guardians Village <noreply@gorillagardians.com>";

function brandHeader() {
  return `
    <div style="background:#2D6A4F;padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-family:Georgia,serif;font-size:22px;letter-spacing:1px;">🦍 Gorilla Guardians Village</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Musanze, Rwanda</p>
    </div>`;
}

function brandFooter() {
  return `
    <div style="background:#f5f5f5;padding:24px 32px;text-align:center;border-top:1px solid #e0e0e0;">
      <p style="margin:0 0 8px;font-family:sans-serif;font-size:12px;color:#888;">
        Gorilla Guardians Village · Musanze, Rwanda
      </p>
      <p style="margin:0;font-family:sans-serif;font-size:12px;color:#aaa;">
        Every purchase and booking supports artisan families and gorilla conservation.
      </p>
    </div>`;
}

function wrap(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    ${brandHeader()}
    <div style="padding:32px;">
      ${content}
    </div>
    ${brandFooter()}
  </div>
</body></html>`;
}

export interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  template: string;
  userId?: number;
  metadata?: Record<string, unknown>;
}

async function logEmail(payload: EmailPayload, status: string, providerId?: string, errorMessage?: string) {
  try {
    await db.insert(emailLogsTable).values({
      userId: payload.userId ?? null,
      toEmail: payload.to,
      toName: payload.toName ?? null,
      subject: payload.subject,
      template: payload.template,
      status,
      provider: "resend",
      providerId: providerId ?? null,
      errorMessage: errorMessage ?? null,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      html: payload.html,
      sentAt: status === "sent" ? new Date() : null,
    });
  } catch (err) {
    console.error("[emailService] Failed to log email:", err);
  }
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[emailService] No RESEND_API_KEY — logging email (not sent): ${payload.subject} → ${payload.to}`);
    await logEmail(payload, "skipped");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[emailService] Resend error:", err);
      await logEmail(payload, "failed", undefined, err);
      return;
    }

    const data = await res.json() as { id?: string };
    await logEmail(payload, "sent", data?.id);
  } catch (err: any) {
    console.error("[emailService] Send error:", err);
    await logEmail(payload, "failed", undefined, String(err));
  }
}

export const emailTemplates = {
  bookingConfirmation(data: {
    customerName: string;
    experienceTitle: string;
    date: string;
    participants: number;
    totalAmount: number;
    bookingId: number;
  }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Booking Confirmed!</h2>
        <p style="color:#666;margin:0;">Thank you for booking with us, ${data.customerName}.</p>
      </div>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 16px;color:#1b4332;font-family:Georgia,serif;">Booking Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Experience</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">${data.experienceTitle}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Date</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">${data.date}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Participants</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">${data.participants}</td></tr>
          <tr style="border-top:1px solid #b7e4c7;"><td style="padding:10px 0 6px;color:#1b4332;font-weight:700;font-size:15px;">Total</td><td style="padding:10px 0 6px;font-weight:700;font-size:15px;text-align:right;color:#2D6A4F;">$${data.totalAmount.toFixed(2)}</td></tr>
        </table>
      </div>
      <p style="color:#666;font-size:14px;line-height:1.6;">Your booking (ID: #${data.bookingId}) is pending confirmation by our team. We'll reach out within 24 hours to confirm your experience.</p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${BASE_URL}/customer/bookings" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">View My Bookings</a>
      </div>`);
  },

  bookingApproved(data: { customerName: string; experienceTitle: string; date: string; participants: number; bookingId: number }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">🎉</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Your Booking is Approved!</h2>
        <p style="color:#666;margin:0;">Great news, ${data.customerName}! Your experience is confirmed.</p>
      </div>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;color:#1b4332;font-family:Georgia,serif;">What's Booked</h3>
        <p style="margin:0 0 6px;font-size:14px;color:#333;"><strong>${data.experienceTitle}</strong></p>
        <p style="margin:0 0 4px;font-size:14px;color:#666;">📅 ${data.date}</p>
        <p style="margin:0;font-size:14px;color:#666;">👥 ${data.participants} participant${data.participants !== 1 ? "s" : ""}</p>
      </div>
      <p style="color:#666;font-size:14px;">We look forward to welcoming you to Gorilla Guardians Village! Please review your booking details and contact us with any questions.</p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${BASE_URL}/customer/bookings" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">View Booking</a>
      </div>`);
  },

  bookingRejected(data: { customerName: string; experienceTitle: string; date: string; bookingId: number }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">😔</div>
        <h2 style="font-family:Georgia,serif;color:#c0392b;margin:0 0 8px;">Booking Request Declined</h2>
        <p style="color:#666;margin:0;">Hi ${data.customerName}, we're unable to confirm this booking request.</p>
      </div>
      <div style="background:#fff8f8;border:1px solid #f5c6c6;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:14px;color:#333;"><strong>${data.experienceTitle}</strong></p>
        <p style="margin:0;font-size:14px;color:#666;">📅 Requested for ${data.date}</p>
      </div>
      <p style="color:#666;font-size:14px;">This is usually due to capacity or scheduling constraints on the requested date. No payment was taken for this request. Please try a different date, or contact our team if you'd like help finding availability.</p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${BASE_URL}/experiences" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-right:12px;">Browse Experiences</a>
        <a href="${BASE_URL}/contact" style="display:inline-block;background:#fff;color:#2D6A4F;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #2D6A4F;">Contact Support</a>
      </div>`);
  },

  bookingCancelled(data: { customerName: string; experienceTitle: string; date: string; bookingId: number }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">❌</div>
        <h2 style="font-family:Georgia,serif;color:#c0392b;margin:0 0 8px;">Booking Cancelled</h2>
        <p style="color:#666;margin:0;">Hi ${data.customerName}, your booking has been cancelled.</p>
      </div>
      <div style="background:#fff8f8;border:1px solid #f5c6c6;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:14px;color:#333;"><strong>${data.experienceTitle}</strong></p>
        <p style="margin:0;font-size:14px;color:#666;">📅 ${data.date}</p>
      </div>
      <p style="color:#666;font-size:14px;">If you believe this is an error or have questions, please contact our support team. We'd love to help you rebook.</p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${BASE_URL}/experiences" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Browse Experiences</a>
      </div>`);
  },

  orderConfirmation(data: {
    customerName: string;
    orderId: number;
    trackingNumber: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    shippingAddress: string;
  }) {
    const itemRows = data.items.map(i =>
      `<tr><td style="padding:6px 0;font-size:14px;">${i.name} × ${i.quantity}</td><td style="padding:6px 0;font-size:14px;text-align:right;">$${(i.price * i.quantity).toFixed(2)}</td></tr>`
    ).join("");
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">📦</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Order Confirmed!</h2>
        <p style="color:#666;margin:0;">Thank you for your purchase, ${data.customerName}.</p>
      </div>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:13px;color:#666;">Order #${data.orderId}</span>
          <span style="font-size:13px;font-weight:600;color:#2D6A4F;">Tracking: ${data.trackingNumber}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;">${itemRows}
          <tr style="border-top:1px solid #b7e4c7;"><td style="padding:10px 0 0;font-weight:700;">Total</td><td style="padding:10px 0 0;font-weight:700;text-align:right;color:#2D6A4F;">$${data.total.toFixed(2)}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:#666;margin-bottom:20px;">📍 Ships to: ${data.shippingAddress}</p>
      <div style="text-align:center;">
        <a href="${BASE_URL}/track?number=${data.trackingNumber}" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-right:12px;">Track Order</a>
        <a href="${BASE_URL}/customer/orders" style="display:inline-block;background:#fff;color:#2D6A4F;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #2D6A4F;">View Orders</a>
      </div>`);
  },

  orderShipped(data: { customerName: string; orderId: number; trackingNumber: string; carrier?: string }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">🚚</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Your Order is Shipped!</h2>
        <p style="color:#666;margin:0;">Great news, ${data.customerName} — your artisan goods are on their way!</p>
      </div>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Order #${data.orderId}</strong></p>
        <p style="margin:0 0 6px;font-size:14px;color:#666;">Tracking: <strong>${data.trackingNumber}</strong></p>
        ${data.carrier ? `<p style="margin:0;font-size:14px;color:#666;">Carrier: ${data.carrier}</p>` : ""}
      </div>
      <div style="text-align:center;">
        <a href="${BASE_URL}/track?number=${data.trackingNumber}" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Track Your Package</a>
      </div>`);
  },

  orderProcessing(data: { customerName: string; orderId: number }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">🎨</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Your Order is Being Crafted</h2>
        <p style="color:#666;margin:0;">Hi ${data.customerName}, your artisan has started working on order #${data.orderId}.</p>
      </div>
      <p style="color:#666;font-size:14px;text-align:center;margin-bottom:24px;">We'll email you again as soon as it ships.</p>
      <div style="text-align:center;">
        <a href="${BASE_URL}/customer/orders" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">View Order</a>
      </div>`);
  },

  orderCancelled(data: { customerName: string; orderId: number }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">❌</div>
        <h2 style="font-family:Georgia,serif;color:#c0392b;margin:0 0 8px;">Order Cancelled</h2>
        <p style="color:#666;margin:0;">Hi ${data.customerName}, your order #${data.orderId} has been cancelled.</p>
      </div>
      <p style="color:#666;font-size:14px;text-align:center;margin-bottom:24px;">If you didn't request this or have questions, please contact our support team.</p>
      <div style="text-align:center;">
        <a href="${BASE_URL}/contact" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Contact Support</a>
      </div>`);
  },

  orderDelivered(data: { customerName: string; orderId: number }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">🎁</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Order Delivered!</h2>
        <p style="color:#666;margin:0;">Your order #${data.orderId} has been delivered, ${data.customerName}. Enjoy your Rwandan craft!</p>
      </div>
      <p style="color:#666;font-size:14px;text-align:center;margin-bottom:24px;">We'd love to hear what you think. Leave a review to help other customers and support our artisans.</p>
      <div style="text-align:center;">
        <a href="${BASE_URL}/products" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Leave a Review</a>
      </div>`);
  },

  paymentSuccessful(data: { customerName: string; orderId: number; amount: number; paymentRef: string }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">💳</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Payment Successful</h2>
        <p style="color:#666;margin:0;">Hi ${data.customerName}, your payment has been processed.</p>
      </div>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Order</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">#${data.orderId}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Amount</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">$${data.amount.toFixed(2)}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Reference</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;font-family:monospace;">${data.paymentRef}</td></tr>
        </table>
      </div>
      <div style="text-align:center;">
        <a href="${BASE_URL}/customer/orders" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">View Orders</a>
      </div>`);
  },

  paymentFailed(data: { customerName: string; orderId?: number; amount?: number }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
        <h2 style="font-family:Georgia,serif;color:#c0392b;margin:0 0 8px;">Payment Failed</h2>
        <p style="color:#666;margin:0;">Hi ${data.customerName}, we had trouble processing your payment.</p>
      </div>
      <p style="color:#666;font-size:14px;text-align:center;margin-bottom:24px;">Please try again or use a different payment method. Your cart items are saved. If you continue to experience issues, contact our support team.</p>
      <div style="text-align:center;">
        <a href="${BASE_URL}/checkout" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-right:12px;">Try Again</a>
        <a href="${BASE_URL}/contact" style="display:inline-block;background:#fff;color:#2D6A4F;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #2D6A4F;">Contact Support</a>
      </div>`);
  },

  welcomeEmail(data: { name: string }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">🌿</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Welcome to Gorilla Guardians Village!</h2>
        <p style="color:#666;margin:0;">Hello ${data.name}, we're thrilled to have you with us.</p>
      </div>
      <p style="color:#444;font-size:14px;line-height:1.7;">Every item in our marketplace is handcrafted by artisan families in Musanze, Rwanda — and every purchase directly supports mountain gorilla conservation. Thank you for being part of this community.</p>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 12px;font-family:Georgia,serif;color:#1b4332;">Explore What We Offer</h3>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#444;line-height:1.8;">
          <li>Handcrafted artisan products shipped worldwide</li>
          <li>Immersive cultural experiences in Rwanda</li>
          <li>Gorilla trekking tours and village stays</li>
          <li>Direct impact on artisan families and conservation</li>
        </ul>
      </div>
      <div style="text-align:center;">
        <a href="${BASE_URL}/products" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-right:12px;">Shop Now</a>
        <a href="${BASE_URL}/experiences" style="display:inline-block;background:#fff;color:#2D6A4F;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #2D6A4F;">Book an Experience</a>
      </div>`);
  },

  packageBookingConfirmation(data: {
    customerName: string;
    packageTitle: string;
    date: string;
    participants: number;
    totalAmount: number;
    experienceTitles: string[];
    packageBookingRef: string;
  }) {
    const experienceRows = data.experienceTitles.map(t => `<li style="margin:0 0 4px;">${t}</li>`).join("");
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Package Booking Confirmed!</h2>
        <p style="color:#666;margin:0;">Thank you for booking with us, ${data.customerName}.</p>
      </div>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;color:#1b4332;font-family:Georgia,serif;">${data.packageTitle}</h3>
        <ul style="margin:0 0 16px;padding-left:18px;font-size:14px;color:#333;">${experienceRows}</ul>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Reference</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;font-family:monospace;">${data.packageBookingRef}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Date</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">${data.date}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Participants</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">${data.participants}</td></tr>
          <tr style="border-top:1px solid #b7e4c7;"><td style="padding:10px 0 6px;color:#1b4332;font-weight:700;font-size:15px;">Total</td><td style="padding:10px 0 6px;font-weight:700;font-size:15px;text-align:right;color:#2D6A4F;">$${data.totalAmount.toFixed(2)}</td></tr>
        </table>
      </div>
      <p style="color:#666;font-size:14px;line-height:1.6;">Each experience in this package is pending confirmation by our team. We'll reach out within 24 hours.</p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${BASE_URL}/customer/bookings" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">View My Bookings</a>
      </div>`);
  },

  bookingPaymentConfirmed(data: { customerName: string; experienceTitle: string; date: string; amount: number; bookingReference?: string | null }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">💳</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Payment Received — You're All Set!</h2>
        <p style="color:#666;margin:0;">Thanks ${data.customerName}, your payment for this experience has been confirmed.</p>
      </div>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          ${data.bookingReference ? `<tr><td style="padding:6px 0;color:#666;font-size:14px;">Reference</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;font-family:monospace;">${data.bookingReference}</td></tr>` : ""}
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Experience</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">${data.experienceTitle}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Date</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">${data.date}</td></tr>
          <tr style="border-top:1px solid #b7e4c7;"><td style="padding:10px 0 6px;color:#1b4332;font-weight:700;font-size:15px;">Amount Paid</td><td style="padding:10px 0 6px;font-weight:700;font-size:15px;text-align:right;color:#2D6A4F;">$${data.amount.toFixed(2)}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${BASE_URL}/customer/bookings" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">View My Bookings</a>
      </div>`);
  },

  passwordReset(data: { name: string; resetUrl: string }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">🔒</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Reset Your Password</h2>
        <p style="color:#666;margin:0;">Hi ${data.name}, we received a request to reset your password.</p>
      </div>
      <p style="color:#666;font-size:14px;text-align:center;margin-bottom:24px;">Click the button below to choose a new password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      <div style="text-align:center;">
        <a href="${data.resetUrl}" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Reset Password</a>
      </div>`);
  },

  contactFormReceived(data: { name: string; email: string; subject: string; message: string }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">📨</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">New Contact Form Message</h2>
      </div>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">From</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">${data.name} &lt;${data.email}&gt;</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px;">Subject</td><td style="padding:6px 0;font-weight:600;font-size:14px;text-align:right;">${data.subject}</td></tr>
        </table>
      </div>
      <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;">
        <p style="margin:0;font-size:14px;color:#444;white-space:pre-line;">${data.message}</p>
      </div>`);
  },

  newMessageNotification(data: { recipientName: string; senderName: string; preview: string }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">💬</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">New Message</h2>
        <p style="color:#666;margin:0;">Hi ${data.recipientName}, you have a new message from ${data.senderName}.</p>
      </div>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#444;font-style:italic;">"${data.preview}"</p>
      </div>
      <div style="text-align:center;">
        <a href="${BASE_URL}/customer/messages" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Reply</a>
      </div>`);
  },

  bookingCompleted(data: { customerName: string; experienceTitle: string; date: string; bookingId: number; bookingReference?: string | null }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">🎉</div>
        <h2 style="font-family:Georgia,serif;color:#2D6A4F;margin:0 0 8px;">Experience Complete!</h2>
        <p style="color:#666;margin:0;">Thank you for joining us, ${data.customerName}. We hope it was unforgettable.</p>
      </div>
      <div style="background:#f8fffe;border:1px solid #b7e4c7;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;color:#1b4332;font-family:Georgia,serif;">${data.experienceTitle}</h3>
        ${data.bookingReference ? `<p style="margin:0 0 6px;font-size:13px;color:#888;font-family:monospace;">Ref: ${data.bookingReference}</p>` : ""}
        <p style="margin:0;font-size:14px;color:#666;">📅 ${data.date}</p>
      </div>
      <p style="color:#444;font-size:14px;text-align:center;margin-bottom:24px;">Every booking supports artisan families and mountain gorilla conservation. Thank you for being part of our community.</p>
      <div style="text-align:center;">
        <a href="${BASE_URL}/experiences" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-right:12px;">Book Again</a>
        <a href="${BASE_URL}/customer/bookings" style="display:inline-block;background:#fff;color:#2D6A4F;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #2D6A4F;">My Bookings</a>
      </div>`);
  },

  bookingPaymentFailed(data: { customerName: string; experienceTitle: string; date: string; bookingId: number; bookingReference?: string | null }) {
    return wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
        <h2 style="font-family:Georgia,serif;color:#c0392b;margin:0 0 8px;">Payment Failed</h2>
        <p style="color:#666;margin:0;">Hi ${data.customerName}, your payment for this booking could not be processed.</p>
      </div>
      <div style="background:#fff8f8;border:1px solid #f5c6c6;border-radius:8px;padding:20px;margin-bottom:24px;">
        ${data.bookingReference ? `<p style="margin:0 0 4px;font-size:13px;color:#888;font-family:monospace;">Ref: ${data.bookingReference}</p>` : ""}
        <p style="margin:0 0 6px;font-size:14px;color:#333;"><strong>${data.experienceTitle}</strong></p>
        <p style="margin:0;font-size:14px;color:#666;">📅 ${data.date}</p>
      </div>
      <p style="color:#666;font-size:14px;text-align:center;margin-bottom:24px;">Please try again with a different payment method. Your booking will remain open for 7 days. Contact our team if you need help.</p>
      <div style="text-align:center;">
        <a href="${BASE_URL}/bookings/${data.bookingId}" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-right:12px;">Retry Payment</a>
        <a href="${BASE_URL}/contact" style="display:inline-block;background:#fff;color:#2D6A4F;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #2D6A4F;">Contact Support</a>
      </div>`);
  },
};
