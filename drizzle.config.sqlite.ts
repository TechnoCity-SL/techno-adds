import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/db/schema/sqlite.ts",
  out: "./drizzle/sqlite",
  dbCredentials: {
    url: process.env.SQLITE_PATH ?? "./local.db",
  },
});
