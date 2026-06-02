import { pgTable, serial, text, boolean, integer, timestamp, json } from "drizzle-orm/pg-core";

export const homepageSectionsTable = pgTable("homepage_sections", {
  id: serial("id").primaryKey(),
  sectionKey: text("section_key").notNull().unique(),
  title: text("title"),
  content: json("content").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
