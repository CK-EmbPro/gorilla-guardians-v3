import { db, notificationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sseManager } from "./sse";

export interface NotificationPayload {
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(payload: NotificationPayload) {
  const [notification] = await db
    .insert(notificationsTable)
    .values({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link ?? null,
      isRead: false,
    })
    .returning();

  const serialized = {
    ...notification,
    link: notification.link ?? null,
    createdAt: notification.createdAt.toISOString(),
  };

  sseManager.emit(payload.userId, "notification", serialized);
  return serialized;
}

export async function notifyAdmins(payload: Omit<NotificationPayload, "userId">) {
  const admins = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));
  const superAdmins = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "super_admin"));
  const all = [...admins, ...superAdmins];
  for (const admin of all) {
    await createNotification({ ...payload, userId: admin.id });
  }
}
