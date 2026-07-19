import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  unique,
} from "drizzle-orm/sqlite-core";

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

export const userPhoneNumbers = sqliteTable(
  "user_phone_numbers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    phoneE164: text("phone_e164").notNull(),
    isVerified: integer("is_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    isWhatsappEnabled: integer("is_whatsapp_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    isHidden: integer("is_hidden", { mode: "boolean" })
      .notNull()
      .default(false),
    verifiedAt: integer("verified_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    unique("user_phone_numbers_user_id_phone_e164_unique").on(
      table.userId,
      table.phoneE164,
    ),
  ],
);

// `target` is a phone (E.164) or email, `otp_hash` is never the raw code — see PLAN.md §5.4.
export const otpCodes = sqliteTable("otp_codes", {
  id: text("id").primaryKey(),
  target: text("target").notNull(),
  otpHash: text("otp_hash").notNull(),
  purpose: text("purpose").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  consumedAt: integer("consumed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
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

// EAV pattern per PLAN.md §6 — deliberately NOT a `jsonb` column on `ads`,
// despite the plan mentioning that as an alternative: jsonb has no SQLite
// equivalent, and portability across the two schema files is the whole point
// of the v1.3 decision. `options` holds a JSON-serialized string array for
// type: "enum"; parsed/validated by Zod at the app layer, not the DB layer.
export const categoryAttributes = sqliteTable(
  "category_attributes",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id").notNull(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    type: text("type").notNull(),
    options: text("options"),
    isRequired: integer("is_required", { mode: "boolean" })
      .notNull()
      .default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    unique("category_attributes_category_id_key_unique").on(
      table.categoryId,
      table.key,
    ),
  ],
);

export const adAttributeValues = sqliteTable("ad_attribute_values", {
  id: text("id").primaryKey(),
  adId: text("ad_id").notNull(),
  categoryAttributeId: text("category_attribute_id").notNull(),
  value: text("value").notNull(),
});

export const adImages = sqliteTable("ad_images", {
  id: text("id").primaryKey(),
  adId: text("ad_id").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});
