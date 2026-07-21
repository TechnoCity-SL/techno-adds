import "server-only";
import { desc, eq, getTableColumns, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export type OwnAdItem = typeof schema.ads.$inferSelect & {
  thumbnailPublicId: string | null;
};

export async function listOwnAds(userId: string): Promise<OwnAdItem[]> {
  return db
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
    .where(eq(schema.ads.userId, userId))
    .orderBy(desc(schema.ads.createdAt));
}
