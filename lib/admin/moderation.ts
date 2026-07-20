import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export class AdNotPendingError extends Error {}

export async function isModerator(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ isModerator: schema.users.isModerator })
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  return user?.isModerator ?? false;
}

export async function listPendingAds() {
  return db
    .select()
    .from(schema.ads)
    .where(eq(schema.ads.status, "pending_review"))
    .orderBy(asc(schema.ads.createdAt));
}

export async function logModerationAction(
  moderatorId: string,
  targetType: "ad" | "user" | "order",
  targetId: string,
  action: string,
  reason?: string,
): Promise<void> {
  await db.insert(schema.moderationActions).values({
    id: randomUUID(),
    moderatorId,
    targetType,
    targetId,
    action,
    reason: reason ?? null,
  });
}

export async function approveAd(
  moderatorId: string,
  adId: string,
): Promise<void> {
  const [ad] = await db
    .select()
    .from(schema.ads)
    .where(eq(schema.ads.id, adId));
  if (!ad || ad.status !== "pending_review") {
    throw new AdNotPendingError(`Ad ${adId} is not pending review`);
  }

  await db
    .update(schema.ads)
    .set({ status: "active", publishedAt: new Date() })
    .where(eq(schema.ads.id, adId));
  await logModerationAction(moderatorId, "ad", adId, "approve");
}

export async function rejectAd(
  moderatorId: string,
  adId: string,
  reason?: string,
): Promise<void> {
  const [ad] = await db
    .select()
    .from(schema.ads)
    .where(eq(schema.ads.id, adId));
  if (!ad || ad.status !== "pending_review") {
    throw new AdNotPendingError(`Ad ${adId} is not pending review`);
  }

  await db
    .update(schema.ads)
    .set({ status: "rejected" })
    .where(eq(schema.ads.id, adId));
  await logModerationAction(moderatorId, "ad", adId, "reject", reason);
}

/**
 * Banning also pulls the user's live/pending ads down (status: "removed") —
 * otherwise a ban would be toothless: the exact spam/abuse content a ban is
 * meant to address would just stay live indefinitely.
 */
export async function banUser(
  moderatorId: string,
  userId: string,
  reason?: string,
): Promise<void> {
  await db
    .update(schema.users)
    .set({ isBanned: true })
    .where(eq(schema.users.id, userId));
  // Only pull down ads that are currently visible/pending — leave expired/
  // sold/rejected/already-removed ads alone, those aren't live content to hide.
  await db
    .update(schema.ads)
    .set({ status: "removed" })
    .where(
      and(
        eq(schema.ads.userId, userId),
        inArray(schema.ads.status, ["active", "pending_review"]),
      ),
    );
  await logModerationAction(moderatorId, "user", userId, "ban", reason);
}

export async function unbanUser(
  moderatorId: string,
  userId: string,
): Promise<void> {
  await db
    .update(schema.users)
    .set({ isBanned: false })
    .where(eq(schema.users.id, userId));
  await logModerationAction(moderatorId, "user", userId, "unban");
}
