import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Production schema (Postgres via Supabase).
 * Mirrors `./sqlite.ts` column-for-column — see PLAN.md §4.1
 * "Local development environment" for why these two files must stay in lockstep.
 * `id` on `users` matches `auth.users.id` (Supabase Auth) once wired up in Phase 1.
 */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  locationId: text("location_id"),
  trustScore: integer("trust_score").notNull().default(0),
  isProSeller: boolean("is_pro_seller").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  parentId: text("parent_id"),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameSi: text("name_si"),
  nameTa: text("name_ta"),
  icon: text("icon"),
});

export const locations = pgTable("locations", {
  id: text("id").primaryKey(),
  parentId: text("parent_id"),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const userPhoneNumbers = pgTable("user_phone_numbers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  phoneE164: text("phone_e164").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  isWhatsappEnabled: boolean("is_whatsapp_enabled").notNull().default(false),
  isHidden: boolean("is_hidden").notNull().default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// `target` is a phone (E.164) or email, `otp_hash` is never the raw code — see PLAN.md §5.4.
export const otpCodes = pgTable("otp_codes", {
  id: text("id").primaryKey(),
  target: text("target").notNull(),
  otpHash: text("otp_hash").notNull(),
  purpose: text("purpose").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const ads = pgTable("ads", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  categoryId: text("category_id").notNull(),
  locationId: text("location_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  isNegotiable: boolean("is_negotiable").notNull().default(false),
  condition: text("condition").notNull(),
  status: text("status").notNull().default("draft"),
  listingTier: text("listing_tier").notNull().default("standard"),
  tierExpiresAt: timestamp("tier_expires_at", { withTimezone: true }),
  viewsCount: integer("views_count").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});
