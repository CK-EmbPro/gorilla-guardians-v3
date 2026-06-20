import { type Request, type Response, type NextFunction } from "express";

type UserRole = "super_admin" | "admin" | "staff" | "artisan" | "customer";

function sess(req: Request) {
  return req.session as any;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!sess(req).userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const s = sess(req);
    if (!s.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(s.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export const STAFF_ROLES: UserRole[] = ["super_admin", "admin", "staff"];
export const ADMIN_ROLES: UserRole[] = ["super_admin", "admin"];
