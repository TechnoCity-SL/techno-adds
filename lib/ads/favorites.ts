import "server-only";
import { and, eq } from "drizzle-orm";
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
