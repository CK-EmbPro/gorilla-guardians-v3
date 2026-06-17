import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const emailLogsTable = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  toEmail: text("to_email").notNull(),
  toName: text("to_name"),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  status: text("status").notNull().default("pending"),
  provider: text("provider").default("resend"),
  providerId: text("provider_id"),
  errorMessage: text("error_message"),
  metadata: text("metadata"),
  html: text("html"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
