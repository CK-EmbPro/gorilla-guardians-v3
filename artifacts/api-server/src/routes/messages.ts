import { Router, type IRouter } from "express";
import { eq, or, and, desc } from "drizzle-orm";
import { db, conversationsTable, messagesTable, usersTable } from "@workspace/db";
import {
  ListMessagesQueryParams,
  CreateConversationBody,
  SendMessageBody,
} from "@workspace/api-zod";
import { sseManager } from "../lib/sse";
import { createNotification } from "../lib/notificationHelper";

const router: IRouter = Router();

const safe = (u: typeof usersTable.$inferSelect | undefined) => u ? {
  id: u.id, email: u.email, name: u.name, role: u.role, avatar: u.avatar ?? null,
  phone: u.phone ?? null, address: u.address ?? null, language: u.language, isActive: u.isActive,
  createdAt: u.createdAt.toISOString(),
} : null;

router.get("/conversations", async (req, res): Promise<void> => {
  const userId = Number(req.query.userId) || ((req.session as any).userId ?? 1);
  const convs = await db.select().from(conversationsTable).where(
    or(eq(conversationsTable.participant1Id, userId), eq(conversationsTable.participant2Id, userId))
  ).orderBy(desc(conversationsTable.updatedAt));
  const rich = await Promise.all(convs.map(async (conv) => {
    const [p1] = await db.select().from(usersTable).where(eq(usersTable.id, conv.participant1Id));
    const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, conv.participant2Id));
    const unread = await db.select().from(messagesTable).where(
      and(eq(messagesTable.conversationId, conv.id), eq(messagesTable.isRead, false))
    );
    const otherUser = conv.participant1Id === userId ? safe(p2) : safe(p1);
    return {
      id: conv.id,
      participants: [safe(p1), safe(p2)].filter(Boolean),
      otherUser,
      lastMessage: conv.lastMessage ?? null,
      unreadCount: unread.length,
      updatedAt: conv.updatedAt.toISOString(),
    };
  }));
  res.json(rich);
});

router.post("/conversations", async (req, res): Promise<void> => {
  const userId = Number(req.query.userId) || ((req.session as any).userId ?? 1);
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const existing = await db.select().from(conversationsTable).where(
    or(
      and(eq(conversationsTable.participant1Id, userId), eq(conversationsTable.participant2Id, parsed.data.participantId)),
      and(eq(conversationsTable.participant1Id, parsed.data.participantId), eq(conversationsTable.participant2Id, userId))
    )
  );
  if (existing.length > 0) {
    const conv = existing[0];
    const [p1] = await db.select().from(usersTable).where(eq(usersTable.id, conv.participant1Id));
    const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, conv.participant2Id));
    const otherUser = conv.participant1Id === userId ? safe(p2) : safe(p1);
    res.status(201).json({ id: conv.id, participants: [safe(p1), safe(p2)].filter(Boolean), otherUser, lastMessage: conv.lastMessage ?? null, unreadCount: 0, updatedAt: conv.updatedAt.toISOString() });
    return;
  }
  const [conv] = await db.insert(conversationsTable).values({
    participant1Id: userId,
    participant2Id: parsed.data.participantId,
  }).returning();
  const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.participantId));
  res.status(201).json({ id: conv.id, participants: [safe(p2)].filter(Boolean), otherUser: safe(p2), lastMessage: null, unreadCount: 0, updatedAt: conv.updatedAt.toISOString() });
});

router.get("/messages", async (req, res): Promise<void> => {
  const params = ListMessagesQueryParams.safeParse(req.query);
  if (!params.success || !params.data.conversationId) { res.status(400).json({ error: "conversationId required" }); return; }
  const page = params.data.page ? Number(params.data.page) : 1;
  const limit = params.data.limit ? Number(params.data.limit) : 50;
  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, Number(params.data.conversationId)))
    .orderBy(desc(messagesTable.createdAt)).limit(limit).offset((page - 1) * limit);
  res.json(messages.map(m => ({ ...m, fileUrl: m.fileUrl ?? null, createdAt: m.createdAt.toISOString() })));
});

router.post("/messages", async (req, res): Promise<void> => {
  const userId = Number(req.query.userId) || ((req.session as any).userId ?? 1);
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [message] = await db.insert(messagesTable).values({
    conversationId: parsed.data.conversationId,
    senderId: userId,
    content: parsed.data.content,
    fileUrl: parsed.data.fileUrl ?? null,
    isRead: false,
  }).returning();

  await db.update(conversationsTable)
    .set({ lastMessage: parsed.data.content })
    .where(eq(conversationsTable.id, parsed.data.conversationId));

  const serialized = { ...message, fileUrl: message.fileUrl ?? null, createdAt: message.createdAt.toISOString() };

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, parsed.data.conversationId));
  if (conv) {
    const receiverId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
    const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    const senderName = sender?.name ?? "Someone";

    sseManager.emit(receiverId, "message", {
      conversationId: parsed.data.conversationId,
      message: serialized,
      senderId: userId,
    });

    await createNotification({
      userId: receiverId,
      type: "message",
      title: `New message from ${senderName}`,
      message: parsed.data.content.length > 60 ? parsed.data.content.slice(0, 60) + "…" : parsed.data.content,
      link: "/messages",
    });
  }

  res.status(201).json(serialized);
});

router.patch("/messages/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [message] = await db.update(messagesTable).set({ isRead: true }).where(eq(messagesTable.id, id)).returning();
  if (!message) { res.status(404).json({ error: "Message not found" }); return; }
  res.json({ ...message, fileUrl: message.fileUrl ?? null, createdAt: message.createdAt.toISOString() });
});

export default router;
