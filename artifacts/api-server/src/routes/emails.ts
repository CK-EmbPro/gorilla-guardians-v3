import { Router, type IRouter } from "express";
import { db, emailLogsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { sendEmail, emailTemplates } from "../lib/emailService";

const router: IRouter = Router();

router.get("/emails/logs", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const offset = Number(req.query.offset ?? 0);
  const logs = await db.select().from(emailLogsTable).orderBy(desc(emailLogsTable.createdAt)).limit(limit).offset(offset);
  res.json(logs.map(l => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    sentAt: l.sentAt?.toISOString() ?? null,
  })));
});

router.post("/emails/resend/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [log] = await db.select().from(emailLogsTable).where(eq(emailLogsTable.id, id));
  if (!log) { res.status(404).json({ error: "Log not found" }); return; }

  await db.update(emailLogsTable).set({ status: "pending", errorMessage: null }).where(eq(emailLogsTable.id, id));

  res.json({ message: "Resend queued — will attempt delivery" });

  setImmediate(async () => {
    try {
      await sendEmail({
        to: log.toEmail,
        toName: log.toName ?? undefined,
        subject: log.subject,
        // Reuse the originally-rendered HTML so a resend delivers the same content the
        // customer was supposed to get. Older rows logged before the `html` column existed
        // fall back to a clearly-labelled placeholder rather than crashing.
        html: log.html ?? `<p>Resent from log #${id} — original content unavailable (logged before HTML capture was added).</p>`,
        template: log.template,
        userId: log.userId ?? undefined,
        metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
      });
    } catch (err) {
      console.error("[emails] resend error:", err);
    }
  });
});

router.get("/emails/stats", async (_req, res): Promise<void> => {
  const logs = await db.select().from(emailLogsTable);
  const total = logs.length;
  const sent = logs.filter(l => l.status === "sent").length;
  const failed = logs.filter(l => l.status === "failed").length;
  const skipped = logs.filter(l => l.status === "skipped").length;
  const pending = logs.filter(l => l.status === "pending").length;
  res.json({ total, sent, failed, skipped, pending, resendConfigured: !!process.env.RESEND_API_KEY });
});

export default router;
