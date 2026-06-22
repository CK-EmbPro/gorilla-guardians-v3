import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, reviewsTable, usersTable, productsTable, experiencesTable } from "@workspace/db";
import {
  ListReviewsQueryParams,
  CreateReviewBody,
  UpdateReviewBody,
  UpdateReviewParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

async function buildReview(review: typeof reviewsTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, review.userId));
  let product = null;
  let experience = null;
  if (review.productId) {
    const [p] = await db.select({ id: productsTable.id, name: productsTable.name }).from(productsTable).where(eq(productsTable.id, review.productId));
    product = p ?? null;
  }
  if (review.experienceId) {
    const [e] = await db.select({ id: experiencesTable.id, title: experiencesTable.title }).from(experiencesTable).where(eq(experiencesTable.id, review.experienceId));
    experience = e ?? null;
  }
  return {
    ...review,
    title: review.title ?? null,
    productId: review.productId ?? null,
    experienceId: review.experienceId ?? null,
    createdAt: review.createdAt.toISOString(),
    updatedAt: undefined,
    product,
    experience,
    user: user ? {
      id: user.id, email: user.email, name: user.name, role: user.role,
      avatar: user.avatar ?? null, phone: user.phone ?? null, address: user.address ?? null,
      language: user.language, isActive: user.isActive, createdAt: user.createdAt.toISOString(),
    } : { id: review.userId, email: "", name: "Guest", role: "customer", avatar: null, phone: null, address: null, language: "en", isActive: true, createdAt: new Date().toISOString() },
  };
}

router.get("/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsQueryParams.safeParse(req.query);
  const conditions: any[] = [];
  if (params.success) {
    if (params.data.productId) conditions.push(eq(reviewsTable.productId, Number(params.data.productId)));
    if (params.data.experienceId) conditions.push(eq(reviewsTable.experienceId, Number(params.data.experienceId)));
    if (params.data.status) conditions.push(eq(reviewsTable.status, params.data.status));
  }
  if (req.query.userId) conditions.push(eq(reviewsTable.userId, Number(req.query.userId)));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const reviews = await db.select().from(reviewsTable).where(where).orderBy(desc(reviewsTable.createdAt));
  const rich = await Promise.all(reviews.map(buildReview));
  res.json(rich);
});

router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const userId = (req.session as any).userId as number;
  const [review] = await db.insert(reviewsTable).values({
    userId,
    productId: parsed.data.productId ?? null,
    experienceId: parsed.data.experienceId ?? null,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    comment: parsed.data.comment,
    images: parsed.data.images ?? [],
    isVerifiedPurchase: false,
    status: "pending",
  }).returning();
  res.status(201).json(await buildReview(review));
});

router.get("/reviews/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));
  if (!review) { res.status(404).json({ error: "Review not found" }); return; }
  res.json(await buildReview(review));
});

router.patch("/reviews/:id", async (req, res): Promise<void> => {
  const params = UpdateReviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [review] = await db.update(reviewsTable).set(parsed.data as any).where(eq(reviewsTable.id, params.data.id)).returning();
  if (!review) { res.status(404).json({ error: "Review not found" }); return; }
  res.json(await buildReview(review));
});

router.delete("/reviews/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const sessionUserId = (req.session as any).userId as number;
  const [existing] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Review not found" }); return; }
  if (existing.userId !== sessionUserId) {
    const [u] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, sessionUserId));
    if (!u || !["admin", "super_admin", "staff"].includes(u.role)) {
      res.status(403).json({ error: "Not authorized" }); return;
    }
  }
  await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
  res.json({ message: "Review deleted" });
});

export default router;
