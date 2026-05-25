import { Router, type IRouter } from "express";
import { sseManager } from "../lib/sse";

const router: IRouter = Router();

router.get("/stream", (req, res): void => {
  const userId = Number(req.query.userId) || ((req.session as any).userId ?? 0);

  if (!userId) {
    res.status(401).json({ error: "userId required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  sseManager.addClient(userId, res);

  res.write(`event: connected\ndata: ${JSON.stringify({ userId, time: Date.now() })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseManager.removeClient(userId, res);
  });

  req.on("error", () => {
    clearInterval(heartbeat);
    sseManager.removeClient(userId, res);
  });
});

export default router;
