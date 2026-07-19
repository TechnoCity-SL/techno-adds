import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/**
 * Local-dev schema (SQLite via better-sqlite3).
 * Mirrors `./postgres.ts` column-for-column — see PLAN.md §4.1
 * "Local development environment" for why these two files must stay in lockstep.
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  locationId: text("location_id"),
  trustScore: integer("trust_score").notNull().default(0),
  isProSeller: integer("is_pro_seller", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  parentId: text("parent_id"),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameSi: text("name_si"),
  nameTa: text("name_ta"),
  icon: text("icon"),
});

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  parentId: text("parent_id"),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const ads = sqliteTable("ads", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  categoryId: text("category_id").notNull(),
  locationId: text("location_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  isNegotiable: integer("is_negotiable", { mode: "boolean" })
    .notNull()
    .default(false),
  condition: text("condition").notNull(),
  status: text("status").notNull().default("draft"),
  listingTier: text("listing_tier").notNull().default("standard"),
  tierExpiresAt: integer("tier_expires_at", { mode: "timestamp" }),
  viewsCount: integer("views_count").notNull().default(0),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
