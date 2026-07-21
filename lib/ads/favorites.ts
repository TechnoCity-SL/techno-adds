import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export async function isFavorited(
  userId: string,
  adId: string,
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(schema.favorites)
    .where(
      and(eq(schema.favorites.userId, userId), eq(schema.favorites.adId, adId)),
    );
  return Boolean(row);
}

/**
 * Batch variant for listing pages (home, category, search) — one query per
 * page render instead of one per card, so showing a favorite-heart on every
 * ad card in a grid doesn't turn into an N+1 query per card.
 */
export async function listFavoritedAdIds(
  userId: string,
  adIds: string[],
): Promise<Set<string>> {
  if (adIds.length === 0) return new Set();
  const rows = await db
    .select({ adId: schema.favorites.adId })
    .from(schema.favorites)
    .where(
      and(
        eq(schema.favorites.userId, userId),
        inArray(schema.favorites.adId, adIds),
      ),
    );
  return new Set(rows.map((r) => r.adId));
}

export async function addFavorite(userId: string, adId: string): Promise<void> {
  await db
    .insert(schema.favorites)
    .values({ userId, adId })
    .onConflictDoNothing({
      target: [schema.favorites.userId, schema.favorites.adId],
    });
}

export async function removeFavorite(
  userId: string,
  adId: string,
): Promise<void> {
  await db
    .delete(schema.favorites)
    .where(
      and(eq(schema.favorites.userId, userId), eq(schema.favorites.adId, adId)),
    );
}
