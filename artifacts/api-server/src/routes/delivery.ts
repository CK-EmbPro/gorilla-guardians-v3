import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliveryTrackingTable, ordersTable } from "@workspace/db";
import { createNotification, notifyAdmins } from "../lib/notificationHelper";
import { sseManager } from "../lib/sse";

const router: IRouter = Router();

const DELIVERY_STATUSES = ["processing", "packed", "shipped", "in_transit", "out_for_delivery", "delivered"];

const STATUS_LABELS: Record<string, string> = {
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  processing: "Your order is being processed and prepared",
  packed: "Your order has been packed and is ready for shipment",
  shipped: "Your order has been handed to the carrier",
  in_transit: "Your order is on its way",
  out_for_delivery: "Your order is out for delivery today",
  delivered: "Your order has been delivered successfully",
};

function serializeTracking(
  tracking: typeof deliveryTrackingTable.$inferSelect,
  order?: typeof ordersTable.$inferSelect | null,
) {
  let timeline: any[] = [];
  try { timeline = JSON.parse(tracking.timeline || "[]"); } catch { /* */ }
  return {
    id: tracking.id,
    orderId: tracking.orderId,
    status: tracking.status,
    trackingNumber: tracking.trackingNumber ?? order?.trackingNumber ?? null,
    carrier: tracking.carrier ?? null,
    estimatedDelivery: tracking.estimatedDelivery ?? null,
    currentLocation: tracking.currentLocation ?? null,
    timeline,
    updatedAt: tracking.updatedAt.toISOString(),
    createdAt: tracking.createdAt.toISOString(),
  };
}

router.get("/delivery/track/:trackingNumber", async (req, res): Promise<void> => {
  const { trackingNumber } = req.params;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.trackingNumber, trackingNumber));
  if (!order) { res.status(404).json({ error: "Tracking number not found" }); return; }
  const [tracking] = await db.select().from(deliveryTrackingTable).where(eq(deliveryTrackingTable.orderId, order.id));
  if (!tracking) { res.status(404).json({ error: "Tracking info not found" }); return; }
  res.json(serializeTracking(tracking, order));
});

router.get("/delivery/:orderId", async (req, res): Promise<void> => {
  const orderId = parseInt(req.params.orderId, 10);
  if (isNaN(orderId)) { res.status(400).json({ error: "Invalid orderId" }); return; }
  const [tracking] = await db.select().from(deliveryTrackingTable).where(eq(deliveryTrackingTable.orderId, orderId));
  if (!tracking) { res.status(404).json({ error: "Tracking not found" }); return; }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  res.json(serializeTracking(tracking, order));
});

router.patch("/delivery/:orderId", async (req, res): Promise<void> => {
  const orderId = parseInt(req.params.orderId, 10);
  if (isNaN(orderId)) { res.status(400).json({ error: "Invalid orderId" }); return; }
  const { status, carrier, estimatedDelivery, currentLocation } = req.body;
  if (!status || !DELIVERY_STATUSES.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${DELIVERY_STATUSES.join(", ")}` });
    return;
  }
  const [existing] = await db.select().from(deliveryTrackingTable).where(eq(deliveryTrackingTable.orderId, orderId));
  if (!existing) { res.status(404).json({ error: "Tracking record not found" }); return; }

  let timeline: any[] = [];
  try { timeline = JSON.parse(existing.timeline || "[]"); } catch { /* */ }
  timeline.push({
    status,
    description: STATUS_DESCRIPTIONS[status] ?? status,
    timestamp: new Date().toISOString(),
    location: currentLocation ?? null,
  });

  const updateData: Record<string, any> = {
    status,
    timeline: JSON.stringify(timeline),
  };
  if (carrier !== undefined) updateData.carrier = carrier;
  if (estimatedDelivery !== undefined) updateData.estimatedDelivery = estimatedDelivery;
  if (currentLocation !== undefined) updateData.currentLocation = currentLocation;

  const [updated] = await db
    .update(deliveryTrackingTable)
    .set(updateData)
    .where(eq(deliveryTrackingTable.orderId, orderId))
    .returning();

  const orderStatusMap: Record<string, string> = {
    processing: "processing",
    packed: "processing",
    shipped: "shipped",
    in_transit: "shipped",
    out_for_delivery: "shipped",
    delivered: "delivered",
  };
  const [order] = await db
    .update(ordersTable)
    .set({ status: orderStatusMap[status] ?? "processing" })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (order) {
    await createNotification({
      userId: order.userId,
      type: "delivery",
      title: `Delivery Update: ${STATUS_LABELS[status] ?? status}`,
      message: STATUS_DESCRIPTIONS[status] ?? `Your order delivery status is now ${status}`,
      link: `/customer/orders/${orderId}`,
    });
    sseManager.emit(order.userId, "delivery_update", {
      orderId,
      status,
      trackingNumber: updated.trackingNumber ?? order.trackingNumber ?? null,
    });
    await notifyAdmins({
      type: "delivery",
      title: `Delivery Updated — Order #${orderId}`,
      message: `Delivery status changed to ${STATUS_LABELS[status] ?? status}`,
      link: `/admin/orders`,
    });
  }

  res.json(serializeTracking(updated, order));
});

export default router;
