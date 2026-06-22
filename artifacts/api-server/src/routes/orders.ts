import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, deliveryTrackingTable, artisansTable, usersTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  GetOrderParams,
  CreateOrderBody,
  UpdateOrderBody,
  UpdateOrderParams,
} from "@workspace/api-zod";
import { createNotification, notifyAdmins } from "../lib/notificationHelper";
import { sendEmail, emailTemplates } from "../lib/emailService";
import { getStripeClient, isStripeConfigured } from "../lib/stripeService";
import { requireAuth, STAFF_ROLES } from "../middlewares/auth";

const APP_URL = process.env.APP_URL ?? "https://gorillaguardians.rw";

const router: IRouter = Router();

function generateTrackingNumber(): string {
  const d = new Date();
  const dateStr =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6).padEnd(6, "0");
  return `GG-${dateStr}-${random}`;
}

async function buildOrder(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    trackingNumber: order.trackingNumber ?? null,
    shippingCarrier: order.shippingCarrier ?? null,
    notes: order.notes ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: undefined,
    items: items.map(item => ({
      ...item,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
      createdAt: undefined,
    })),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  const page = params.success && params.data.page ? Number(params.data.page) : 1;
  const limit = params.success && params.data.limit ? Number(params.data.limit) : 20;
  const sessionUserId = (req.session as any).userId as number;
  const sessionRole = (req.session as any).role as string;
  const isStaff = STAFF_ROLES.includes(sessionRole as any);
  const conditions: any[] = [];
  if (params.success) {
    // Customers can only see their own orders; staff can filter by any userId
    if (isStaff) {
      if (params.data.userId) conditions.push(eq(ordersTable.userId, Number(params.data.userId)));
    } else {
      conditions.push(eq(ordersTable.userId, sessionUserId));
    }
    if (params.data.status) conditions.push(eq(ordersTable.status, params.data.status));
  } else {
    if (!isStaff) conditions.push(eq(ordersTable.userId, sessionUserId));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const total = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(where);
  const orders = await db.select().from(ordersTable).where(where)
    .limit(limit).offset((page - 1) * limit).orderBy(desc(ordersTable.createdAt));
  const rich = await Promise.all(orders.map(buildOrder));
  res.json({ orders: rich, total: Number(total[0]?.count ?? 0), page, totalPages: Math.ceil(Number(total[0]?.count ?? 0) / limit) });
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const userId = (req.session as any).userId as number;
  let subtotal = 0;
  const enrichedItems: any[] = [];
  for (const item of parsed.data.items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) { res.status(404).json({ error: `Product ${item.productId} not found` }); return; }
    const itemSubtotal = Number(product.price) * item.quantity;
    subtotal += itemSubtotal;
    enrichedItems.push({ product, quantity: item.quantity, subtotal: itemSubtotal });
  }
  const shippingCost = parsed.data.shippingType === "pickup" ? 0 : 25;
  const trackingNumber = generateTrackingNumber();
  const [order] = await db.insert(ordersTable).values({
    userId,
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
    status: "pending",
    paymentMethod: parsed.data.paymentMethod,
    paymentStatus: "pending",
    shippingAddress: parsed.data.shippingAddress,
    shippingType: parsed.data.shippingType,
    notes: parsed.data.notes ?? null,
    trackingNumber,
  }).returning();
  for (const enriched of enrichedItems) {
    await db.insert(orderItemsTable).values({
      orderId: order.id,
      productId: enriched.product.id,
      productName: enriched.product.name,
      productImage: enriched.product.images[0] ?? "",
      quantity: enriched.quantity,
      price: Number(enriched.product.price),
      subtotal: enriched.subtotal,
    });
  }
  await db.insert(deliveryTrackingTable).values({
    orderId: order.id,
    status: "processing",
    trackingNumber,
    timeline: JSON.stringify([{ status: "processing", description: "Order placed successfully", timestamp: new Date().toISOString() }]),
  });

  // Notify customer
  await createNotification({
    userId,
    type: "order",
    title: "Order Confirmed!",
    message: `Your order #${order.id} has been placed. Tracking: ${trackingNumber}`,
    link: `/customer/orders/${order.id}`,
  });

  // Notify admins
  await notifyAdmins({
    type: "order",
    title: "New Order Received",
    message: `Order #${order.id} was placed for $${(subtotal + shippingCost).toFixed(2)}`,
    link: `/admin/orders`,
  });

  // Notify artisans whose products were ordered
  const notifiedArtisanUserIds = new Set<number>();
  for (const enriched of enrichedItems) {
    const artisanId = enriched.product.artisanId;
    if (!artisanId) continue;
    const [artisan] = await db.select().from(artisansTable).where(eq(artisansTable.id, artisanId));
    if (artisan && !notifiedArtisanUserIds.has(artisan.userId)) {
      notifiedArtisanUserIds.add(artisan.userId);
      await createNotification({
        userId: artisan.userId,
        type: "order",
        title: "New Product Sale!",
        message: `Your product "${enriched.product.name}" was ordered (Order #${order.id})`,
        link: `/artisan/earnings`,
      });
    }
  }

  // Send order confirmation email
  const [customer] = await db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  if (customer?.email) {
    sendEmail({
      to: customer.email,
      toName: customer.name,
      subject: `Order Confirmed — #${order.id}`,
      html: emailTemplates.orderConfirmation({
        customerName: customer.name,
        orderId: order.id,
        trackingNumber,
        items: enrichedItems.map(i => ({ name: i.product.name, quantity: i.quantity, price: Number(i.product.price) })),
        total: subtotal + shippingCost,
        shippingAddress: parsed.data.shippingAddress,
      }),
      template: "order_confirmation",
      userId,
      metadata: { orderId: order.id, trackingNumber },
    }).catch(err => console.error("[orders] email error:", err));
  }

  res.status(201).json(await buildOrder(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(await buildOrder(order));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [prevOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  const [order] = await db.update(ordersTable).set(parsed.data as any).where(eq(ordersTable.id, params.data.id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  // Notify on status change
  if (parsed.data.status && prevOrder && parsed.data.status !== prevOrder.status) {
    const statusMessages: Record<string, string> = {
      processing: "Your order is being processed",
      shipped: "Your order has been shipped!",
      delivered: "Your order has been delivered. Enjoy!",
      cancelled: "Your order has been cancelled.",
    };
    await createNotification({
      userId: order.userId,
      type: "order",
      title: `Order #${order.id} — ${parsed.data.status.charAt(0).toUpperCase() + parsed.data.status.slice(1)}`,
      message: statusMessages[parsed.data.status] ?? `Your order status changed to ${parsed.data.status}`,
      link: `/customer/orders/${order.id}`,
    });
    await notifyAdmins({
      type: "order",
      title: `Order #${order.id} Status Updated`,
      message: `Status changed from ${prevOrder.status} to ${parsed.data.status}`,
      link: `/admin/orders`,
    });

    // Send email on key status changes
    const [customer] = await db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, order.userId));
    if (customer?.email) {
      if (parsed.data.status === "shipped") {
        sendEmail({
          to: customer.email,
          toName: customer.name,
          subject: `Your Order #${order.id} Has Been Shipped!`,
          html: emailTemplates.orderShipped({
            customerName: customer.name,
            orderId: order.id,
            trackingNumber: order.trackingNumber ?? "",
            carrier: order.shippingCarrier ?? undefined,
          }),
          template: "order_shipped",
          userId: order.userId,
        }).catch(err => console.error("[orders] email error:", err));
      } else if (parsed.data.status === "delivered") {
        sendEmail({
          to: customer.email,
          toName: customer.name,
          subject: `Your Order #${order.id} Has Been Delivered!`,
          html: emailTemplates.orderDelivered({ customerName: customer.name, orderId: order.id }),
          template: "order_delivered",
          userId: order.userId,
        }).catch(err => console.error("[orders] email error:", err));
      } else if (parsed.data.status === "processing") {
        sendEmail({
          to: customer.email,
          toName: customer.name,
          subject: `Your Order #${order.id} is Being Processed`,
          html: emailTemplates.orderProcessing({ customerName: customer.name, orderId: order.id }),
          template: "order_processing",
          userId: order.userId,
        }).catch(err => console.error("[orders] email error:", err));
      } else if (parsed.data.status === "cancelled") {
        sendEmail({
          to: customer.email,
          toName: customer.name,
          subject: `Order #${order.id} Cancelled`,
          html: emailTemplates.orderCancelled({ customerName: customer.name, orderId: order.id }),
          template: "order_cancelled",
          userId: order.userId,
        }).catch(err => console.error("[orders] email error:", err));
      }
    }
  }

  res.json(await buildOrder(order));
});

router.post("/orders/:id/checkout-session", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!isStripeConfigured()) { res.status(503).json({ error: "Payments are not configured yet. Set STRIPE_SECRET_KEY." }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (order.paymentStatus === "paid") { res.status(400).json({ error: "Order is already paid" }); return; }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  if (items.length === 0) { res.status(400).json({ error: "Order has no items" }); return; }

  const lineItems = items.map(item => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.productName, images: item.productImage ? [item.productImage] : undefined },
      unit_amount: Math.round(Number(item.price) * 100),
    },
    quantity: item.quantity,
  }));
  if (order.shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Shipping", images: undefined },
        unit_amount: Math.round(Number(order.shippingCost) * 100),
      },
      quantity: 1,
    });
  }

  const session = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${APP_URL}/payment-success?orderId=${order.id}`,
    cancel_url: `${APP_URL}/payment-failed?orderId=${order.id}&reason=Checkout+was+cancelled.+Your+order+is+saved.`,
    metadata: { kind: "order", orderId: String(order.id) },
  });

  await db.update(ordersTable).set({ stripeSessionId: session.id }).where(eq(ordersTable.id, order.id));

  res.status(201).json({ url: session.url });
});

export default router;
