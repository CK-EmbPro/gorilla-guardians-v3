import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  ListNotificationsQueryParams,
  MarkNotificationReadParams,
} from "@workspace/api-zod";
import { createNotification } from "../lib/notificationHelper";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const userId = Number(req.query.userId) || ((req.session as any).userId ?? 1);
  const params = ListNotificationsQueryParams.safeParse(req.query);
  const conditions: any[] = [eq(notificationsTable.userId, userId)];
  if (params.success && (params.data.unreadOnly === true || params.data.unreadOnly === "true" as any)) {
    conditions.push(eq(notificationsTable.isRead, false));
  }
  const notifications = await db.select().from(notificationsTable)
    .where(and(...conditions)).orderBy(desc(notificationsTable.createdAt)).limit(50);
  res.json(notifications.map(n => ({ ...n, link: n.link ?? null, createdAt: n.createdAt.toISOString() })));
});

router.post("/notifications", async (req, res): Promise<void> => {
  const { userId, type, title, message, link } = req.body;
  if (!userId || !title || !message) {
    res.status(400).json({ error: "userId, title, message required" });
    return;
  }
  const notification = await createNotification({ userId: Number(userId), type: type ?? "system", title, message, link });
  res.status(201).json(notification);
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [notification] = await db.update(notificationsTable)
    .set({ isRead: true }).where(eq(notificationsTable.id, params.data.id)).returning();
  if (!notification) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json({ ...notification, link: notification.link ?? null, createdAt: notification.createdAt.toISOString() });
});

router.patch("/notifications/read-all", async (req, res): Promise<void> => {
  const userId = Number(req.query.userId) || ((req.session as any).userId ?? 1);
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, userId));
  res.json({ message: "All notifications marked as read" });
});

export default router;
