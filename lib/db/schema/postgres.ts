import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  uuid,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Production schema (Postgres via Supabase).
 * Mirrors `./sqlite.ts` column-for-column — see PLAN.md §4.1
 * "Local development environment" for why these two files must stay in lockstep.
 * `id` on `users` matches `auth.users.id` (Supabase Auth, wired up in Phase 1).
 *
 * Exception to the mirroring rule: `users.id`, `ads.userId`, and
 * `userPhoneNumbers.userId` are `uuid` here (not `text` like everywhere else)
 * because `auth.users.id` is natively `uuid` in Postgres — found by testing
 * that a `text`/`uuid` foreign key won't even validate ("operator does not
 * exist: uuid = text"). SQLite has no native uuid type, so its mirror stays
 * `text` for these columns; both still round-trip as plain JS strings, so no
 * app code needs to know about the difference.
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  locationId: text("location_id"),
  trustScore: integer("trust_score").notNull().default(0),
  isProSeller: boolean("is_pro_seller").notNull().default(false),
  isModerator: boolean("is_moderator").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
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

export const userPhoneNumbers = pgTable(
  "user_phone_numbers",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    phoneE164: text("phone_e164").notNull(),
    isVerified: boolean("is_verified").notNull().default(false),
    isWhatsappEnabled: boolean("is_whatsapp_enabled").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    unique("user_phone_numbers_user_id_phone_e164_unique").on(
      table.userId,
      table.phoneE164,
    ),
  ],
);

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
  userId: uuid("user_id").notNull(),
  categoryId: text("category_id").notNull(),
  locationId: text("location_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  isNegotiable: boolean("is_negotiable").notNull().default(false),
  condition: text("condition").notNull(),
  status: text("status").notNull().default("pending_review"),
  listingTier: text("listing_tier").notNull().default("standard"),
  tierExpiresAt: timestamp("tier_expires_at", { withTimezone: true }),
  viewsCount: integer("views_count").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// EAV pattern per PLAN.md §6 — deliberately NOT a `jsonb` column on `ads`,
// despite the plan mentioning that as an alternative: jsonb has no SQLite
// equivalent, and portability across the two schema files is the whole point
// of the v1.3 decision. `options` holds a JSON-serialized string array for
// type: "enum"; parsed/validated by Zod at the app layer, not the DB layer.
export const categoryAttributes = pgTable(
  "category_attributes",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    key: text("key").notNull(),
    label: text("label").notNull(),
    type: text("type").notNull(),
    options: text("options"),
    isRequired: boolean("is_required").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    unique("category_attributes_category_id_key_unique").on(
      table.categoryId,
      table.key,
    ),
  ],
);

export const adAttributeValues = pgTable("ad_attribute_values", {
  id: text("id").primaryKey(),
  adId: text("ad_id")
    .notNull()
    .references(() => ads.id, { onDelete: "cascade" }),
  categoryAttributeId: text("category_attribute_id")
    .notNull()
    .references(() => categoryAttributes.id),
  value: text("value").notNull(),
});

export const adImages = pgTable("ad_images", {
  id: text("id").primaryKey(),
  adId: text("ad_id")
    .notNull()
    .references(() => ads.id, { onDelete: "cascade" }),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    adId: text("ad_id")
      .notNull()
      .references(() => ads.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.adId] })],
);

// `targetId` is polymorphic (an ads.id or a users.id depending on `targetType`),
// so deliberately no FK on it — only `moderatorId` (always a real user) gets one.
export const moderationActions = pgTable("moderation_actions", {
  id: text("id").primaryKey(),
  moderatorId: uuid("moderator_id")
    .notNull()
    .references(() => users.id),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  action: text("action").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    adId: text("ad_id")
      .notNull()
      .references(() => ads.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    unique("conversations_ad_id_buyer_id_unique").on(table.adId, table.buyerId),
  ],
);

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// `queryParams` is a JSON-serialized string, not jsonb — same portability
// reasoning as category_attributes.options (PLAN.md §4.1/v1.3).
export const savedSearches = pgTable("saved_searches", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  queryParams: text("query_params").notNull(),
  notifyEnabled: boolean("notify_enabled").notNull().default(true),
  lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// `targetId` polymorphic (ads.id or users.id), same reasoning as moderation_actions.
export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reporterUserId: uuid("reporter_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// Rate card (PLAN.md §10) — admin/service_role-managed reference data, same
// pattern as categories/category_attributes. `code` is the stable key call
// sites reference (e.g. "top_ad_7d"); `isActive` lets a product be retired
// without deleting it out from under historical orders that reference it.
export const listingProducts = pgTable("listing_products", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  tier: text("tier").notNull(),
  durationDays: integer("duration_days").notNull(),
  priceLkr: real("price_lkr").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// `amountLkr` snapshots the price at purchase time rather than joining back
// to listing_products.priceLkr, since the rate card can change after an
// order is placed and the order must keep its original, actually-paid amount.
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  adId: text("ad_id")
    .notNull()
    .references(() => ads.id, { onDelete: "cascade" }),
  listingProductId: text("listing_product_id")
    .notNull()
    .references(() => listingProducts.id),
  amountLkr: real("amount_lkr").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

// PayHere-specific transaction log — `rawPayload` is a JSON-serialized string
// (not jsonb, same portability reasoning as category_attributes.options) of
// the full signed notify payload, kept for audit/debugging since it's the
// only record of exactly what PayHere told us. Never exposed to any client
// role (see the RLS migration) — this is server/webhook-only data.
export const paymentTransactions = pgTable("payment_transactions", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerPaymentId: text("provider_payment_id"),
  statusCode: text("status_code"),
  rawPayload: text("raw_payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const bankTransferProofs = pgTable("bank_transfer_proofs", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  reviewedByModeratorId: uuid("reviewed_by_moderator_id").references(
    () => users.id,
  ),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});
