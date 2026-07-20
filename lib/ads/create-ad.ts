import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

// Postgres-backed, not sqlite-client: ads.userId is a real Supabase Auth user id
// (see PLAN.md §4.1 "Auth-keyed data needs Postgres, not SQLite").

export class InvalidCategoryError extends Error {}
export class InvalidLocationError extends Error {}
export class UserBannedError extends Error {}

export class InvalidAttributesError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super(`Invalid attributes: ${issues.join("; ")}`);
    this.issues = issues;
  }
}

export interface CreateAdParams {
  userId: string;
  categoryId: string;
  locationId: string;
  title: string;
  description: string;
  price: number;
  isNegotiable: boolean;
  condition: string;
  attributes: Record<string, string>;
  images: string[];
}

export async function createAd(params: CreateAdParams): Promise<string> {
  const [user] = await db
    .select({ isBanned: schema.users.isBanned })
    .from(schema.users)
    .where(eq(schema.users.id, params.userId));
  if (user?.isBanned) {
    // A ban that only pulls down existing ads but doesn't stop new ones is
    // toothless — this is the other half of banUser()'s enforcement.
    throw new UserBannedError("This account has been banned from posting ads.");
  }

  const [category] = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, params.categoryId));
  if (!category) {
    throw new InvalidCategoryError(`Unknown category: ${params.categoryId}`);
  }

  const [location] = await db
    .select()
    .from(schema.locations)
    .where(eq(schema.locations.id, params.locationId));
  if (!location) {
    throw new InvalidLocationError(`Unknown location: ${params.locationId}`);
  }

  const attributeDefs = await db
    .select()
    .from(schema.categoryAttributes)
    .where(eq(schema.categoryAttributes.categoryId, params.categoryId));

  const issues: string[] = [];
  const knownKeys = new Set(attributeDefs.map((def) => def.key));

  for (const key of Object.keys(params.attributes)) {
    if (!knownKeys.has(key)) {
      issues.push(`Unknown attribute for this category: ${key}`);
    }
  }

  for (const def of attributeDefs) {
    const value = params.attributes[def.key];
    if (def.isRequired && (value === undefined || value === "")) {
      issues.push(`${def.key} is required`);
      continue;
    }
    if (value === undefined || value === "") continue;
    if (def.type === "number" && Number.isNaN(Number(value))) {
      issues.push(`${def.key} must be a number`);
    }
    if (def.type === "enum" && def.options) {
      const options = JSON.parse(def.options) as string[];
      if (!options.includes(value)) {
        issues.push(`${def.key} must be one of: ${options.join(", ")}`);
      }
    }
  }

  if (issues.length > 0) {
    throw new InvalidAttributesError(issues);
  }

  const adId = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(schema.ads).values({
      id: adId,
      userId: params.userId,
      categoryId: params.categoryId,
      locationId: params.locationId,
      title: params.title,
      description: params.description,
      price: params.price,
      isNegotiable: params.isNegotiable,
      condition: params.condition,
      // Not "draft": the wizard's submit step IS the final creation call (no
      // separate save-draft UX exists), so the ad is genuinely awaiting
      // moderation the moment it's created — matches PLAN.md's draft ->
      // pending_review -> active state machine and gives Phase 5's
      // moderation queue something real to review. Found/fixed while
      // building Phase 5: "draft" status had no path forward, ever.
      status: "pending_review",
    });

    for (const def of attributeDefs) {
      const value = params.attributes[def.key];
      if (value === undefined || value === "") continue;
      await tx.insert(schema.adAttributeValues).values({
        id: randomUUID(),
        adId,
        categoryAttributeId: def.id,
        value,
      });
    }

    for (const [index, publicId] of params.images.entries()) {
      await tx.insert(schema.adImages).values({
        id: randomUUID(),
        adId,
        cloudinaryPublicId: publicId,
        sortOrder: index,
      });
    }
  });

  return adId;
}
