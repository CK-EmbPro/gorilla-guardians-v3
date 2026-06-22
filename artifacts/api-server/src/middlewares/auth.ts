import { type Request, type Response, type NextFunction } from "express";
import { verifyToken } from "../lib/authToken";

type UserRole = "super_admin" | "admin" | "staff" | "artisan" | "customer";

function sess(req: Request) {
  return req.session as any;
}

function resolveAuth(req: Request): { userId: number; role: string } | null {
  const s = sess(req);
  if (s.userId) return { userId: s.userId, role: s.role };

  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const payload = verifyToken(auth.slice(7));
    if (payload) {
      // Hydrate session so downstream route handlers can read s.userId / s.role
      s.userId = payload.userId;
      s.role = payload.role;
      return payload;
    }
  }
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!resolveAuth(req)) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = resolveAuth(req);
    if (!auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(auth.role as UserRole)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export const STAFF_ROLES: UserRole[] = ["super_admin", "admin", "staff"];
export const ADMIN_ROLES: UserRole[] = ["super_admin", "admin"];
