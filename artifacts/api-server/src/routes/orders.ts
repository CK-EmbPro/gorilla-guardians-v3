import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, deliveryTrackingTable, artisansTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  GetOrderParams,
  CreateOrderBody,
  UpdateOrderBody,
  UpdateOrderParams,
} from "@workspace/api-zod";
import { createNotification, notifyAdmins } from "../lib/notificationHelper";

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

router.get("/orders", async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  const page = params.success && params.data.page ? Number(params.data.page) : 1;
  const limit = params.success && params.data.limit ? Number(params.data.limit) : 20;
  const conditions: any[] = [];
  if (params.success) {
    if (params.data.userId) conditions.push(eq(ordersTable.userId, Number(params.data.userId)));
    if (params.data.status) conditions.push(eq(ordersTable.status, params.data.status));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const total = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(where);
  const orders = await db.select().from(ordersTable).where(where)
    .limit(limit).offset((page - 1) * limit).orderBy(desc(ordersTable.createdAt));
  const rich = await Promise.all(orders.map(buildOrder));
  res.json({ orders: rich, total: Number(total[0]?.count ?? 0), page, totalPages: Math.ceil(Number(total[0]?.count ?? 0) / limit) });
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const userId = (req.session as any).userId ?? 1;
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
  }

  res.json(await buildOrder(order));
});

export default router;
