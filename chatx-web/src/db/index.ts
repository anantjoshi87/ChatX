import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be a Neon postgres connection string");
}

// Initialize the Neon serverless client
const sql = neon(process.env.DATABASE_URL);

// Export the db instance with the schema attached for relational queries
export const db = drizzle(sql, { schema });
