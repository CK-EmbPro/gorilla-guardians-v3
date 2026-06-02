import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, homepageSectionsTable } from "@workspace/db";

const router: IRouter = Router();

const DEFAULT_SECTIONS: Record<string, any> = {
  hero: {
    heading: "Handmade in Rwanda,\nWith Love",
    subheading: "Every purchase protects mountain gorillas and empowers artisan families in Musanze, Rwanda.",
    buttonText: "Shop Now",
    buttonLink: "/products",
    backgroundImage: null,
  },
  about_village: {
    heading: "Welcome to Gorilla Guardians Village",
    body: "We are a community of artisans living on the edge of Volcanoes National Park in Rwanda. Through our crafts and cultural experiences, we support mountain gorilla conservation while building sustainable livelihoods.",
  },
  featured_products: { title: "Featured Handcrafts", subtitle: "Each piece tells a story of tradition, skill, and conservation." },
  featured_experiences: { title: "Immersive Experiences", subtitle: "Trek gorillas. Weave baskets. Cook Rwandan food. Stay with artisan families." },
  featured_artisans: { title: "Meet Our Artisans", subtitle: "Former poachers turned conservation ambassadors. Master craftspeople." },
  featured_events: { title: "Events & Festivals", subtitle: "Cultural celebrations and artisan showcases across Rwanda." },
  gallery: { images: [], title: "Life at the Village" },
  impact_banner: {
    heading: "Your Purchase Makes a Difference",
    stats: [
      { value: 200, label: "Families Supported", suffix: "+" },
      { value: 47, label: "Countries Reached", suffix: "" },
      { value: 89, label: "Drop in Poaching", suffix: "%" },
      { value: 1000, label: "Mountain Gorillas", suffix: "+" },
    ],
  },
};

router.get("/homepage", async (req, res): Promise<void> => {
  const rows = await db.select().from(homepageSectionsTable);
  const result: Record<string, any> = {};
  for (const [key, defaults] of Object.entries(DEFAULT_SECTIONS)) {
    const row = rows.find(r => r.sectionKey === key);
    result[key] = {
      ...(row ?? { sectionKey: key, title: null, isActive: true, displayOrder: 0 }),
      content: row ? { ...defaults, ...(row.content as object) } : defaults,
    };
  }
  for (const row of rows) {
    if (!DEFAULT_SECTIONS[row.sectionKey]) {
      result[row.sectionKey] = { ...row };
    }
  }
  res.json(result);
});

router.get("/homepage/:key", async (req, res): Promise<void> => {
  const { key } = req.params;
  const [row] = await db.select().from(homepageSectionsTable).where(eq(homepageSectionsTable.sectionKey, key));
  const defaults = DEFAULT_SECTIONS[key] ?? {};
  res.json({
    sectionKey: key,
    content: row ? { ...defaults, ...(row.content as object) } : defaults,
    isActive: row?.isActive ?? true,
    displayOrder: row?.displayOrder ?? 0,
    title: row?.title ?? null,
  });
});

router.post("/homepage/:key", async (req, res): Promise<void> => {
  const { key } = req.params;
  const { content, title, isActive, displayOrder } = req.body;
  const existing = await db.select().from(homepageSectionsTable).where(eq(homepageSectionsTable.sectionKey, key));
  if (existing.length > 0) {
    const updates: any = {};
    if (content !== undefined) updates.content = content;
    if (title !== undefined) updates.title = title;
    if (isActive !== undefined) updates.isActive = isActive;
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;
    const [row] = await db.update(homepageSectionsTable).set(updates).where(eq(homepageSectionsTable.sectionKey, key)).returning();
    res.json(row);
  } else {
    const [row] = await db.insert(homepageSectionsTable).values({
      sectionKey: key,
      content: content ?? DEFAULT_SECTIONS[key] ?? {},
      title: title ?? null,
      isActive: isActive ?? true,
      displayOrder: displayOrder ?? 0,
    }).returning();
    res.json(row);
  }
});

export default router;
