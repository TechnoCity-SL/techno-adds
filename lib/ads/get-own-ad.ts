import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export async function getOwnAd(userId: string, adId: string) {
  const [ad] = await db
    .select()
    .from(schema.ads)
    .where(eq(schema.ads.id, adId));
  if (!ad || ad.userId !== userId) return null;
  return ad;
}
