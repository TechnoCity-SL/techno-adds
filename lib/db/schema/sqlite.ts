import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  unique,
  primaryKey,
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
  isModerator: integer("is_moderator", { mode: "boolean" })
    .notNull()
    .default(false),
  isBanned: integer("is_banned", { mode: "boolean" }).notNull().default(false),
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
  status: text("status").notNull().default("pending_review"),
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

export const favorites = sqliteTable(
  "favorites",
  {
    userId: text("user_id").notNull(),
    adId: text("ad_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.adId] })],
);

export const moderationActions = sqliteTable("moderation_actions", {
  id: text("id").primaryKey(),
  moderatorId: text("moderator_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  action: text("action").notNull(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    adId: text("ad_id").notNull(),
    buyerId: text("buyer_id").notNull(),
    sellerId: text("seller_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    unique("conversations_ad_id_buyer_id_unique").on(table.adId, table.buyerId),
  ],
);

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  senderId: text("sender_id").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const savedSearches = sqliteTable("saved_searches", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  queryParams: text("query_params").notNull(),
  notifyEnabled: integer("notify_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  lastNotifiedAt: integer("last_notified_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  reporterUserId: text("reporter_user_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const listingProducts = sqliteTable("listing_products", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  tier: text("tier").notNull(),
  durationDays: integer("duration_days").notNull(),
  priceLkr: real("price_lkr").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  adId: text("ad_id").notNull(),
  listingProductId: text("listing_product_id").notNull(),
  amountLkr: real("amount_lkr").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  paidAt: integer("paid_at", { mode: "timestamp" }),
});

export const paymentTransactions = sqliteTable("payment_transactions", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  provider: text("provider").notNull(),
  providerPaymentId: text("provider_payment_id"),
  statusCode: text("status_code"),
  rawPayload: text("raw_payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const bankTransferProofs = sqliteTable("bank_transfer_proofs", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  reviewedByModeratorId: text("reviewed_by_moderator_id"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
