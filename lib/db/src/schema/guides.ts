import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const guidesTable = pgTable("guides", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  name: text("name").notNull(),
  photo: text("photo"),
  biography: text("biography"),
  languages: text("languages").array().notNull().default([]),
  experienceLevel: text("experience_level").notNull().default("intermediate"),
  rating: real("rating").notNull().default(5.0),
  reviewCount: integer("review_count").notNull().default(0),
  available: boolean("available").notNull().default(true),
  specialties: text("specialties").array().notNull().default([]),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGuideSchema = createInsertSchema(guidesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type Guide = typeof guidesTable.$inferSelect;
