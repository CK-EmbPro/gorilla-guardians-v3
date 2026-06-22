import { createHmac } from "crypto";

const secret = () => process.env.SESSION_SECRET ?? "gorilla-guardians-secret";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function generateToken(userId: number, role: string): string {
  const expiresAt = Date.now() + TTL_MS;
  const payload = `${userId}:${role}:${expiresAt}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payloadB64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    if (sig !== expected) return null;
    const parts = payload.split(":");
    if (parts.length !== 3) return null;
    const userId = Number(parts[0]);
    const role = parts[1];
    const expiresAt = Number(parts[2]);
    if (isNaN(userId) || !role || isNaN(expiresAt) || Date.now() > expiresAt) return null;
    return { userId, role };
  } catch {
    return null;
  }
}
