import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bookingsTable } from "./bookings";
import { usersTable } from "./users";

export const bookingHistoryTable = pgTable("booking_history", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookingsTable.id),
  status: text("status").notNull(),
  note: text("note"),
  changedBy: integer("changed_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingHistorySchema = createInsertSchema(bookingHistoryTable).omit({ id: true, createdAt: true });
export type InsertBookingHistory = z.infer<typeof insertBookingHistorySchema>;
export type BookingHistory = typeof bookingHistoryTable.$inferSelect;
