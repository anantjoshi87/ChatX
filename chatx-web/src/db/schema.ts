import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  // We use text() instead of serial/uuid because Clerk generates its own string IDs (e.g., 'user_2t...')
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
