import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export interface DigestEntry {
  savedSearchId: string;
  userId: string;
  query: string;
  matches: { id: string; title: string; price: number; createdAt: Date }[];
}

interface MatchRow {
  id: string;
  title: string;
  price: string;
  created_at: Date;
}

/**
 * Computes which saved searches have new matching ads since they were last
 * checked, and advances lastNotifiedAt so the same ad isn't matched twice on
 * the next run. Deliberately does NOT send an email — lib/notifications has
 * no email provider adapter yet (CLAUDE.md rule #8, Resend isn't wired up
 * anywhere in this codebase), so actual delivery is a separate, tracked
 * follow-up, not silently faked here. Same reasoning for why this is only
 * manually-triggerable right now: real scheduling needs Vercel Cron, which
 * isn't linked yet (PLAN.md Phase 0 status).
 */
export async function runSavedSearchDigest(): Promise<DigestEntry[]> {
  const searches = await db
    .select()
    .from(schema.savedSearches)
    .where(eq(schema.savedSearches.notifyEnabled, true));

  const results: DigestEntry[] = [];

  for (const search of searches) {
    const { q } = JSON.parse(search.queryParams) as { q: string };
    const since = (search.lastNotifiedAt ?? search.createdAt).toISOString();

    const rows = (await db.execute(sql`
      select id, title, price, created_at
      from ads
      where status = 'active'
        and created_at > ${since}
        and search_vector @@ websearch_to_tsquery('english', ${q})
      order by created_at desc
    `)) as unknown as MatchRow[];

    if (rows.length > 0) {
      results.push({
        savedSearchId: search.id,
        userId: search.userId,
        query: q,
        matches: rows.map((r) => ({
          id: r.id,
          title: r.title,
          price: Number(r.price),
          createdAt: r.created_at,
        })),
      });
    }

    await db
      .update(schema.savedSearches)
      .set({ lastNotifiedAt: new Date() })
      .where(eq(schema.savedSearches.id, search.id));
  }

  return results;
}
