import { pgTable, text, serial, timestamp, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { experiencesTable } from "./experiences";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingReference: text("booking_reference").unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  experienceId: integer("experience_id").notNull().references(() => experiencesTable.id),
  guideId: integer("guide_id"),
  date: date("date").notNull(),
  participants: integer("participants").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  specialRequests: text("special_requests"),
  qrCodeData: text("qr_code_data"),
  checkinAt: timestamp("checkin_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
  rescheduledFrom: integer("rescheduled_from"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
