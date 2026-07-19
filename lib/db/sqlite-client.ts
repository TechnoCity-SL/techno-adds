import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema/sqlite";

const sqlite = new Database(process.env.SQLITE_PATH ?? "./local.db");
sqlite.pragma("journal_mode = WAL");
// Without this, concurrent opens (e.g. Next.js build workers all importing this
// module at once) fail immediately with SQLITE_BUSY instead of waiting briefly.
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });
export { schema };
