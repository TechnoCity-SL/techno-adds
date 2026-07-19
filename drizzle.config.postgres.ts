import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required to generate/run Postgres migrations",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/postgres.ts",
  out: "./drizzle/postgres",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
