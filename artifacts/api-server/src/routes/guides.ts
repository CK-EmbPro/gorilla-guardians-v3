import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, guidesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/guides", async (req, res): Promise<void> => {
  const guides = await db.select().from(guidesTable).orderBy(desc(guidesTable.createdAt));
  res.json(guides.map(g => ({
    ...g,
    rating: Number(g.rating),
  })));
});

router.get("/guides/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [guide] = await db.select().from(guidesTable).where(eq(guidesTable.id, id));
  if (!guide) { res.status(404).json({ error: "Guide not found" }); return; }
  res.json({ ...guide, rating: Number(guide.rating) });
});

router.post("/guides", async (req, res): Promise<void> => {
  const { name, photo, biography, languages, experienceLevel, available, specialties, phone, email, userId } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [guide] = await db.insert(guidesTable).values({
    name,
    photo: photo ?? null,
    biography: biography ?? null,
    languages: languages ?? [],
    experienceLevel: experienceLevel ?? "intermediate",
    available: available ?? true,
    specialties: specialties ?? [],
    phone: phone ?? null,
    email: email ?? null,
    userId: userId ?? null,
  }).returning();
  res.status(201).json({ ...guide, rating: Number(guide.rating) });
});

router.patch("/guides/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const allowed = ["name", "photo", "biography", "languages", "experienceLevel", "available", "specialties", "phone", "email", "rating", "reviewCount"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }
  const [guide] = await db.update(guidesTable).set(updates).where(eq(guidesTable.id, id)).returning();
  if (!guide) { res.status(404).json({ error: "Guide not found" }); return; }
  res.json({ ...guide, rating: Number(guide.rating) });
});

router.delete("/guides/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(guidesTable).where(eq(guidesTable.id, id));
  res.json({ success: true });
});

export default router;
