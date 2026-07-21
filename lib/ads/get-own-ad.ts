import "server-only";
import { eq, getTableColumns, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export async function getOwnAd(userId: string, adId: string) {
  const [ad] = await db
    .select({
      ...getTableColumns(schema.ads),
      thumbnailPublicId: sql<string | null>`(
        select ${schema.adImages.cloudinaryPublicId}
        from ${schema.adImages}
        where ${schema.adImages.adId} = ${schema.ads.id}
        order by ${schema.adImages.sortOrder} asc
        limit 1
      )`,
    })
    .from(schema.ads)
    .where(eq(schema.ads.id, adId));
  if (!ad || ad.userId !== userId) return null;
  return ad;
}
