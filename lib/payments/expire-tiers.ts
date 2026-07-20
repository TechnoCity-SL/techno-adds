import "server-only";
import { and, lt, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

/**
 * Demotes ads whose boost has expired back to "standard" (PLAN.md §10).
 * Not strictly load-bearing for correctness — list-ads.ts already computes
 * the *effective* tier from tier_expires_at on every read, so an ad with a
 * lapsed boost never gets pinned/badged even if this hasn't run yet — this
 * is what keeps the ads table itself tidy (My Ads no longer shows a stale
 * "Top" label) and is where a future "your boost expired, renew?" email
 * would hook in. Manually-triggerable for the same reason as the saved-search
 * digest: Vercel Cron isn't linked yet (PLAN.md Phase 0 status).
 */
export async function expireTiers(): Promise<{ demoted: number }> {
  const rows = await db
    .update(schema.ads)
    .set({ listingTier: "standard", tierExpiresAt: null })
    .where(
      and(
        ne(schema.ads.listingTier, "standard"),
        lt(schema.ads.tierExpiresAt, new Date()),
      ),
    )
    .returning({ id: schema.ads.id });
  return { demoted: rows.length };
}
