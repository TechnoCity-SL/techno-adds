import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export type OwnAdItem = typeof schema.ads.$inferSelect;

export async function listOwnAds(userId: string): Promise<OwnAdItem[]> {
  return db
    .select()
    .from(schema.ads)
    .where(eq(schema.ads.userId, userId))
    .orderBy(desc(schema.ads.createdAt));
}
