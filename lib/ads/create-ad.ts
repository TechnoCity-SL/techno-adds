import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

// Postgres-backed, not sqlite-client: ads.userId is a real Supabase Auth user id
// (see PLAN.md §4.1 "Auth-keyed data needs Postgres, not SQLite").

export class InvalidCategoryError extends Error {}

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
}

export async function createAd(params: CreateAdParams): Promise<string> {
  const [category] = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, params.categoryId));
  if (!category) {
    throw new InvalidCategoryError(`Unknown category: ${params.categoryId}`);
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
      status: "draft",
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
  });

  return adId;
}
