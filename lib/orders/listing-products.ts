import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export type ListingProduct = typeof schema.listingProducts.$inferSelect;

export async function listActiveListingProducts(): Promise<ListingProduct[]> {
  return db
    .select()
    .from(schema.listingProducts)
    .where(eq(schema.listingProducts.isActive, true));
}
