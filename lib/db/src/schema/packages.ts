import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { experiencesTable } from "./experiences";

export const experiencePackagesTable = pgTable("experience_packages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  images: text("images").array().notNull().default([]),
  price: real("price").notNull(),
  discountPercent: real("discount_percent").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Join table: which experiences make up a package, and in what display order.
export const experiencePackageItemsTable = pgTable("experience_package_items", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").notNull().references(() => experiencePackagesTable.id),
  experienceId: integer("experience_id").notNull().references(() => experiencesTable.id),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertExperiencePackageSchema = createInsertSchema(experiencePackagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExperiencePackage = z.infer<typeof insertExperiencePackageSchema>;
export type ExperiencePackage = typeof experiencePackagesTable.$inferSelect;
export type ExperiencePackageItem = typeof experiencePackageItemsTable.$inferSelect;
