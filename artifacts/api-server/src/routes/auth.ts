import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterBody,
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  GetMeResponse,
  ListUsersQueryParams,
  GetUserParams,
  UpdateUserBody,
} from "@workspace/api-zod";
import { createHash, randomBytes } from "crypto";
import { sendEmail, emailTemplates } from "../lib/emailService";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const APP_URL = process.env.APP_URL ?? "https://gorilla-guardians.replit.app";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "gorilla-salt").digest("hex");
}

function safeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar ?? null,
    phone: user.phone ?? null,
    address: user.address ?? null,
    language: user.language,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, name, role } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash: hashPassword(password),
    name,
    role,
  }).returning();
  (req.session as any).userId = user.id;
  (req.session as any).role = user.role;

  // Send welcome email
  sendEmail({
    to: user.email,
    toName: user.name,
    subject: "Welcome to Gorilla Guardians Village! 🦍",
    html: emailTemplates.welcomeEmail({ name: user.name }),
    template: "welcome",
    userId: user.id,
  }).catch(err => console.error("[auth] welcome email error:", err));

  req.session.save((err) => {
    if (err) { res.status(500).json({ error: "Session error" }); return; }
    res.status(201).json({ user: safeUser(user), token: `session-${user.id}` });
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  (req.session as any).userId = user.id;
  (req.session as any).role = user.role;
  req.session.save((err) => {
    if (err) { res.status(500).json({ error: "Session error" }); return; }
    res.json({ user: safeUser(user), token: `session-${user.id}` });
  });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email));
  // Always respond the same way whether or not the account exists, so this endpoint can't be
  // used to enumerate registered emails.
  if (user) {
    const token = randomBytes(32).toString("hex");
    await db.update(usersTable).set({
      resetToken: token,
      resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    }).where(eq(usersTable.id, user.id));

    sendEmail({
      to: user.email,
      toName: user.name,
      subject: "Reset Your Gorilla Guardians Village Password",
      html: emailTemplates.passwordReset({ name: user.name, resetUrl: `${APP_URL}/reset-password?token=${token}` }),
      template: "password_reset",
      userId: user.id,
    }).catch(err => console.error("[auth] password reset email error:", err));
  }
  res.json({ message: "If an account exists for that email, a reset link has been sent." });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, parsed.data.token));
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }
  await db.update(usersTable).set({
    passwordHash: hashPassword(parsed.data.password),
    resetToken: null,
    resetTokenExpiresAt: null,
  }).where(eq(usersTable.id, user.id));
  res.json({ message: "Password updated successfully" });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {});
  res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetMeResponse.parse(safeUser(user)));
});

router.get("/users", async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  const page = params.success && params.data.page ? params.data.page : 1;
  const limit = params.success && params.data.limit ? params.data.limit : 20;
  const users = await db.select().from(usersTable).limit(limit).offset((page - 1) * limit);
  res.json(users.map(safeUser));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(safeUser(user));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [user] = await db.update(usersTable).set(parsed.data as any).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(safeUser(user));
});

export default router;
