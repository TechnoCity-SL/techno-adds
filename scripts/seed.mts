/**
 * Idempotent seed for categories, category_attributes, and locations.
 * Targets Postgres directly (not lib/db/postgres-client.ts, since that has
 * a `server-only` guard meant for the Next.js bundler context — this script
 * runs standalone via `npm run db:seed`).
 *
 * Safe to re-run: categories/locations upsert on their unique `slug`,
 * category_attributes upsert on their unique (category_id, key).
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema/postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed Postgres");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

const categories = [
  { id: "vehicles", slug: "vehicles", nameEn: "Vehicles", icon: "car" },
  { id: "property", slug: "property", nameEn: "Property", icon: "home" },
  {
    id: "techno-gadgets",
    slug: "techno-gadgets",
    nameEn: "Techno & Gadgets",
    icon: "smartphone",
  },
  { id: "other", slug: "other", nameEn: "Other", icon: "package" },
];

const locations = [
  { id: "colombo", slug: "colombo", name: "Colombo" },
  { id: "gampaha", slug: "gampaha", name: "Gampaha" },
  { id: "kandy", slug: "kandy", name: "Kandy" },
  { id: "galle", slug: "galle", name: "Galle" },
  { id: "jaffna", slug: "jaffna", name: "Jaffna" },
  { id: "kurunegala", slug: "kurunegala", name: "Kurunegala" },
  { id: "anuradhapura", slug: "anuradhapura", name: "Anuradhapura" },
  { id: "batticaloa", slug: "batticaloa", name: "Batticaloa" },
  { id: "matara", slug: "matara", name: "Matara" },
  { id: "negombo", slug: "negombo", name: "Negombo" },
];

type AttrDef = {
  key: string;
  label: string;
  type: "text" | "number" | "enum" | "boolean";
  options?: string[];
  isRequired?: boolean;
};

const categoryAttributeDefs: Record<string, AttrDef[]> = {
  vehicles: [
    { key: "brand", label: "Brand", type: "text", isRequired: true },
    { key: "model", label: "Model", type: "text", isRequired: true },
    { key: "year", label: "Year", type: "number", isRequired: true },
    { key: "mileage", label: "Mileage (km)", type: "number", isRequired: true },
    {
      key: "fuel_type",
      label: "Fuel Type",
      type: "enum",
      options: ["Petrol", "Diesel", "Hybrid", "Electric"],
      isRequired: true,
    },
    {
      key: "transmission",
      label: "Transmission",
      type: "enum",
      options: ["Manual", "Automatic"],
      isRequired: true,
    },
  ],
  property: [
    {
      key: "property_type",
      label: "Property Type",
      type: "enum",
      options: ["House", "Apartment", "Land", "Room"],
      isRequired: true,
    },
    { key: "bedrooms", label: "Bedrooms", type: "number" },
    { key: "bathrooms", label: "Bathrooms", type: "number" },
    { key: "land_size", label: "Land Size", type: "text" },
    { key: "floor_area", label: "Floor Area", type: "text" },
  ],
  "techno-gadgets": [
    {
      key: "device_type",
      label: "Device Type",
      type: "enum",
      options: ["Phone", "Laptop", "Desktop", "Tablet", "Accessory"],
      isRequired: true,
    },
    { key: "brand", label: "Brand", type: "text", isRequired: true },
    { key: "model", label: "Model", type: "text" },
    { key: "ram", label: "RAM", type: "text" },
    { key: "storage", label: "Storage", type: "text" },
  ],
  other: [],
};

// Placeholder rate card (PLAN.md §10 durations) — prices are rough
// order-of-magnitude guesses for the Sri Lankan classifieds market, not
// researched numbers; the doc's own note says "tune after competitor
// benchmarking." Safe to change any time since `orders.amountLkr` snapshots
// the price paid at purchase time, not a live join back to this table.
const listingProducts = [
  { id: "top_ad_3d", code: "top_ad_3d", tier: "top", durationDays: 3, priceLkr: 300 },
  { id: "top_ad_7d", code: "top_ad_7d", tier: "top", durationDays: 7, priceLkr: 600 },
  { id: "top_ad_15d", code: "top_ad_15d", tier: "top", durationDays: 15, priceLkr: 1000 },
  { id: "super_ad_7d", code: "super_ad_7d", tier: "super", durationDays: 7, priceLkr: 1200 },
  { id: "super_ad_15d", code: "super_ad_15d", tier: "super", durationDays: 15, priceLkr: 2000 },
  { id: "super_ad_30d", code: "super_ad_30d", tier: "super", durationDays: 30, priceLkr: 3500 },
];

async function main() {
  for (const category of categories) {
    await db
      .insert(schema.categories)
      .values(category)
      .onConflictDoNothing({ target: schema.categories.slug });
  }
  console.log(`Seeded ${categories.length} categories`);

  for (const location of locations) {
    await db
      .insert(schema.locations)
      .values(location)
      .onConflictDoNothing({ target: schema.locations.slug });
  }
  console.log(`Seeded ${locations.length} locations`);

  let attrCount = 0;
  for (const [categoryId, attrs] of Object.entries(categoryAttributeDefs)) {
    for (const [index, attr] of attrs.entries()) {
      await db
        .insert(schema.categoryAttributes)
        .values({
          id: `${categoryId}__${attr.key}`,
          categoryId,
          key: attr.key,
          label: attr.label,
          type: attr.type,
          options: attr.options ? JSON.stringify(attr.options) : null,
          isRequired: attr.isRequired ?? false,
          sortOrder: index,
        })
        .onConflictDoUpdate({
          target: [
            schema.categoryAttributes.categoryId,
            schema.categoryAttributes.key,
          ],
          set: {
            label: attr.label,
            type: attr.type,
            options: attr.options ? JSON.stringify(attr.options) : null,
            isRequired: attr.isRequired ?? false,
            sortOrder: index,
          },
        });
      attrCount++;
    }
  }
  console.log(`Seeded ${attrCount} category attributes`);

  for (const product of listingProducts) {
    await db
      .insert(schema.listingProducts)
      .values(product)
      .onConflictDoUpdate({
        target: schema.listingProducts.code,
        set: {
          tier: product.tier,
          durationDays: product.durationDays,
          priceLkr: product.priceLkr,
        },
      });
  }
  console.log(`Seeded ${listingProducts.length} listing products`);
}

try {
  await main();
} finally {
  await client.end({ timeout: 1 });
}
