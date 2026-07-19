import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/postgres";

/**
 * Not exercised until a Supabase project + DATABASE_URL exist (see PLAN.md
 * Build Status, Phase 0 pending items). Kept in lockstep with sqlite-client.ts
 * so wiring this up in Phase 1 is a drop-in swap, not a rewrite.
 */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to use the Postgres client");
}

const client = postgres(process.env.DATABASE_URL);

export const db = drizzle(client, { schema });
export { schema };
