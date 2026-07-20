import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export interface AdDetail {
  ad: typeof schema.ads.$inferSelect;
  category: typeof schema.categories.$inferSelect | undefined;
  location: typeof schema.locations.$inferSelect | undefined;
  attributes: { key: string; label: string; value: string }[];
  images: { id: string; cloudinaryPublicId: string; sortOrder: number }[];
  seller: typeof schema.users.$inferSelect | undefined;
  sellerPhones: string[];
}

/**
 * Mirrors the `ads_select_active_or_own` RLS policy in application code — see
 * CLAUDE.md rule #4: our Postgres client (lib/db/postgres-client.ts) bypasses
 * RLS, so this check is the *only* enforcement for this read path. Factored
 * out here (rather than duplicated in the API route and the detail page) so
 * the one security-critical check can't drift out of sync between the two.
 */
export async function getAdForViewing(
  adId: string,
  viewerId: string | null,
): Promise<AdDetail | null> {
  const [ad] = await db
    .select()
    .from(schema.ads)
    .where(eq(schema.ads.id, adId));
  if (!ad) return null;

  const isOwner = viewerId !== null && viewerId === ad.userId;
  if (ad.status !== "active" && !isOwner) return null;

  const [category] = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, ad.categoryId));
  const [location] = await db
    .select()
    .from(schema.locations)
    .where(eq(schema.locations.id, ad.locationId));

  const attributes = await db
    .select({
      key: schema.categoryAttributes.key,
      label: schema.categoryAttributes.label,
      value: schema.adAttributeValues.value,
    })
    .from(schema.adAttributeValues)
    .innerJoin(
      schema.categoryAttributes,
      eq(
        schema.adAttributeValues.categoryAttributeId,
        schema.categoryAttributes.id,
      ),
    )
    .where(eq(schema.adAttributeValues.adId, adId));

  const images = await db
    .select()
    .from(schema.adImages)
    .where(eq(schema.adImages.adId, adId))
    .orderBy(asc(schema.adImages.sortOrder));

  const [seller] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, ad.userId));

  const phoneRows = await db
    .select({ phoneE164: schema.userPhoneNumbers.phoneE164 })
    .from(schema.userPhoneNumbers)
    .where(
      and(
        eq(schema.userPhoneNumbers.userId, ad.userId),
        eq(schema.userPhoneNumbers.isVerified, true),
        eq(schema.userPhoneNumbers.isHidden, false),
      ),
    );

  return {
    ad,
    category,
    location,
    attributes,
    images,
    seller,
    sellerPhones: phoneRows.map((r) => r.phoneE164),
  };
}
