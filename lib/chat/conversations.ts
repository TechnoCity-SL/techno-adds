import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export class AdNotFoundError extends Error {}
export class CannotMessageOwnAdError extends Error {}

export interface ConversationSummary {
  id: string;
  adId: string;
  adTitle: string;
  adThumbnailPublicId: string | null;
  otherUserId: string;
  otherDisplayName: string;
  otherAvatarUrl: string | null;
  lastMessageContent: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
}

interface ConversationRow {
  id: string;
  ad_id: string;
  ad_title: string;
  ad_thumbnail_public_id: string | null;
  other_user_id: string;
  other_display_name: string;
  other_avatar_url: string | null;
  last_message_content: string | null;
  last_message_at: Date | null;
  created_at: Date;
}

/**
 * Only the buyer can start a conversation, and only about an active ad they
 * don't own themselves — mirrors ad visibility (buyers only ever see active
 * ads) and matches the buyer-only insert policy in
 * drizzle/postgres/0019_phase4_chat_rls.sql. Idempotent via the
 * unique(ad_id, buyer_id) constraint: re-messaging the same seller about the
 * same ad returns the existing thread instead of creating a duplicate.
 */
export async function getOrCreateConversation(
  buyerId: string,
  adId: string,
): Promise<string> {
  const [ad] = await db
    .select({ userId: schema.ads.userId, status: schema.ads.status })
    .from(schema.ads)
    .where(eq(schema.ads.id, adId));
  if (!ad || ad.status !== "active") {
    throw new AdNotFoundError(`Ad not found or not active: ${adId}`);
  }
  if (ad.userId === buyerId) {
    throw new CannotMessageOwnAdError(
      "You can't message yourself about your own ad.",
    );
  }

  await db
    .insert(schema.conversations)
    .values({ id: randomUUID(), adId, buyerId, sellerId: ad.userId })
    .onConflictDoNothing({
      target: [schema.conversations.adId, schema.conversations.buyerId],
    });

  const [row] = await db
    .select({ id: schema.conversations.id })
    .from(schema.conversations)
    .where(
      and(
        eq(schema.conversations.adId, adId),
        eq(schema.conversations.buyerId, buyerId),
      ),
    );

  return row.id;
}

/**
 * Single-conversation variant of listConversationsForUser's row shape, scoped
 * to one id and returning null if the conversation doesn't exist OR the
 * viewer isn't a participant — callers should treat both cases as "not
 * found" (matches getAdForViewing's not-found-vs-unauthorized handling).
 */
export async function getConversationSummary(
  conversationId: string,
  userId: string,
): Promise<ConversationSummary | null> {
  const rows = (await db.execute(sql`
    select
      c.id,
      c.ad_id,
      a.title as ad_title,
      (select ai.cloudinary_public_id from ad_images ai where ai.ad_id = c.ad_id order by ai.sort_order asc limit 1) as ad_thumbnail_public_id,
      case when c.buyer_id = ${userId} then c.seller_id else c.buyer_id end as other_user_id,
      u.display_name as other_display_name,
      u.avatar_url as other_avatar_url,
      (select m.content from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message_content,
      (select m.created_at from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message_at,
      c.created_at
    from conversations c
    inner join ads a on a.id = c.ad_id
    inner join users u on u.id = (case when c.buyer_id = ${userId} then c.seller_id else c.buyer_id end)
    where c.id = ${conversationId} and (c.buyer_id = ${userId} or c.seller_id = ${userId})
  `)) as unknown as ConversationRow[];

  const r = rows[0];
  if (!r) return null;

  return {
    id: r.id,
    adId: r.ad_id,
    adTitle: r.ad_title,
    adThumbnailPublicId: r.ad_thumbnail_public_id,
    otherUserId: r.other_user_id,
    otherDisplayName: r.other_display_name,
    otherAvatarUrl: r.other_avatar_url,
    lastMessageContent: r.last_message_content,
    lastMessageAt: r.last_message_at,
    createdAt: r.created_at,
  };
}

export async function isConversationParticipant(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.conversations.id })
    .from(schema.conversations)
    .where(
      and(
        eq(schema.conversations.id, conversationId),
        or(
          eq(schema.conversations.buyerId, userId),
          eq(schema.conversations.sellerId, userId),
        ),
      ),
    );
  return Boolean(row);
}

export async function listConversationsForUser(
  userId: string,
): Promise<ConversationSummary[]> {
  const rows = (await db.execute(sql`
    select
      c.id,
      c.ad_id,
      a.title as ad_title,
      (select ai.cloudinary_public_id from ad_images ai where ai.ad_id = c.ad_id order by ai.sort_order asc limit 1) as ad_thumbnail_public_id,
      case when c.buyer_id = ${userId} then c.seller_id else c.buyer_id end as other_user_id,
      u.display_name as other_display_name,
      u.avatar_url as other_avatar_url,
      (select m.content from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message_content,
      (select m.created_at from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message_at,
      c.created_at
    from conversations c
    inner join ads a on a.id = c.ad_id
    inner join users u on u.id = (case when c.buyer_id = ${userId} then c.seller_id else c.buyer_id end)
    where c.buyer_id = ${userId} or c.seller_id = ${userId}
    order by coalesce(
      (select m.created_at from messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
      c.created_at
    ) desc
  `)) as unknown as ConversationRow[];

  return rows.map((r) => ({
    id: r.id,
    adId: r.ad_id,
    adTitle: r.ad_title,
    adThumbnailPublicId: r.ad_thumbnail_public_id,
    otherUserId: r.other_user_id,
    otherDisplayName: r.other_display_name,
    otherAvatarUrl: r.other_avatar_url,
    lastMessageContent: r.last_message_content,
    lastMessageAt: r.last_message_at,
    createdAt: r.created_at,
  }));
}
