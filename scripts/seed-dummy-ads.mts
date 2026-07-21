/**
 * DEV-ONLY: seeds 13 realistic "active" ads (with real Cloudinary thumbnails
 * already uploaded via scripts/_seed_upload_images.mts, folder "seed-ads/")
 * so the homepage/category/search pages have something to render besides
 * empty states. Not run in CI or referenced by any app code path.
 *
 * Idempotent: every row uses a deterministic "seed-*" id and upserts on it,
 * so re-running just refreshes the same rows instead of duplicating them.
 *
 * Requires at least one real user already in `users` (created automatically
 * by the auth.users sync trigger on first login) to attribute ads to.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema/postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed dummy ads");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();

type DummyAd = {
  id: string;
  categoryId: "vehicles" | "property" | "techno-gadgets";
  locationId: string;
  title: string;
  description: string;
  price: number;
  isNegotiable: boolean;
  condition: "new" | "used";
  listingTier: "standard" | "top" | "super";
  image: string;
  createdAtDaysAgo: number;
};

const dummyAds: DummyAd[] = [
  // Vehicles
  {
    id: "seed-veh-1",
    categoryId: "vehicles",
    locationId: "colombo",
    title: "Toyota Aqua Hybrid 2015, Full Option",
    description:
      "Well maintained Toyota Aqua, single owner, all service records available. Alloy wheels, reverse camera, leather seats.",
    price: 6_950_000,
    isNegotiable: true,
    condition: "used",
    listingTier: "super",
    image: "seed-ads/vehicles-1",
    createdAtDaysAgo: 1,
  },
  {
    id: "seed-veh-2",
    categoryId: "vehicles",
    locationId: "kandy",
    title: "Honda Vezel 2018 RS Spec",
    description:
      "Brand new import, low mileage, RS bodykit, sunroof. Genuine buyers only.",
    price: 12_500_000,
    isNegotiable: true,
    condition: "used",
    listingTier: "top",
    image: "seed-ads/vehicles-2",
    createdAtDaysAgo: 2,
  },
  {
    id: "seed-veh-3",
    categoryId: "vehicles",
    locationId: "galle",
    title: "Bajaj Pulsar NS200, 2021",
    description:
      "Excellent condition, recently serviced, new tyres fitted last month.",
    price: 750_000,
    isNegotiable: false,
    condition: "used",
    listingTier: "standard",
    image: "seed-ads/vehicles-3",
    createdAtDaysAgo: 3,
  },
  {
    id: "seed-veh-4",
    categoryId: "vehicles",
    locationId: "negombo",
    title: "Suzuki Every Van 2016, Ideal for Business",
    description: "Reliable delivery van, well maintained, new battery.",
    price: 3_200_000,
    isNegotiable: true,
    condition: "used",
    listingTier: "standard",
    image: "seed-ads/vehicles-1",
    createdAtDaysAgo: 5,
  },
  // Property
  {
    id: "seed-prop-1",
    categoryId: "property",
    locationId: "colombo",
    title: "Modern 3BR Apartment in Rajagiriya",
    description:
      "Spacious 3-bedroom apartment with city view, 24-hour security, swimming pool access, close to schools and shops.",
    price: 45_000_000,
    isNegotiable: true,
    condition: "used",
    listingTier: "super",
    image: "seed-ads/property-1",
    createdAtDaysAgo: 1,
  },
  {
    id: "seed-prop-2",
    categoryId: "property",
    locationId: "gampaha",
    title: "20 Perch Land in Ja-Ela, Clear Deeds",
    description:
      "Residential land, walking distance to main road, water and electricity available.",
    price: 8_500_000,
    isNegotiable: true,
    condition: "new",
    listingTier: "top",
    image: "seed-ads/property-2",
    createdAtDaysAgo: 2,
  },
  {
    id: "seed-prop-3",
    categoryId: "property",
    locationId: "matara",
    title: "Beachside 2BR House for Rent",
    description:
      "Fully furnished house, 5 minutes from the beach, ideal for a small family.",
    price: 65_000,
    isNegotiable: false,
    condition: "used",
    listingTier: "standard",
    image: "seed-ads/property-3",
    createdAtDaysAgo: 4,
  },
  {
    id: "seed-prop-4",
    categoryId: "property",
    locationId: "kurunegala",
    title: "Newly Built 4BR House with Garden",
    description:
      "Brand new construction, tiled throughout, 10 perches of land, quiet neighborhood.",
    price: 32_000_000,
    isNegotiable: true,
    condition: "new",
    listingTier: "standard",
    image: "seed-ads/property-1",
    createdAtDaysAgo: 6,
  },
  // Techno & Gadgets
  {
    id: "seed-tech-1",
    categoryId: "techno-gadgets",
    locationId: "colombo",
    title: "iPhone 14 Pro Max 256GB, Space Black",
    description:
      "Excellent condition, no scratches, comes with original box and charger. Battery health 92%.",
    price: 385_000,
    isNegotiable: true,
    condition: "used",
    listingTier: "super",
    image: "seed-ads/techno-1",
    createdAtDaysAgo: 1,
  },
  {
    id: "seed-tech-2",
    categoryId: "techno-gadgets",
    locationId: "kandy",
    title: "MacBook Air M2 2023, 512GB",
    description:
      "Barely used, still under Apple warranty, perfect for students and professionals.",
    price: 425_000,
    isNegotiable: true,
    condition: "used",
    listingTier: "top",
    image: "seed-ads/techno-2",
    createdAtDaysAgo: 2,
  },
  {
    id: "seed-tech-3",
    categoryId: "techno-gadgets",
    locationId: "jaffna",
    title: "Samsung 55-inch 4K Smart TV",
    description: "Brand new, sealed box, 1-year seller warranty included.",
    price: 165_000,
    isNegotiable: false,
    condition: "new",
    listingTier: "standard",
    image: "seed-ads/techno-3",
    createdAtDaysAgo: 3,
  },
  {
    id: "seed-tech-4",
    categoryId: "techno-gadgets",
    locationId: "batticaloa",
    title: "Sony WH-1000XM4 Noise Cancelling Headphones",
    description: "Used for 2 months, works perfectly, all accessories included.",
    price: 55_000,
    isNegotiable: true,
    condition: "used",
    listingTier: "standard",
    image: "seed-ads/techno-1",
    createdAtDaysAgo: 4,
  },
  {
    id: "seed-tech-5",
    categoryId: "techno-gadgets",
    locationId: "anuradhapura",
    title: "Gaming PC — Ryzen 5, RTX 3060, 16GB RAM",
    description: "Custom built, runs all modern games at high settings.",
    price: 285_000,
    isNegotiable: true,
    condition: "used",
    listingTier: "standard",
    image: "seed-ads/techno-2",
    createdAtDaysAgo: 7,
  },
];

async function main() {
  const [sellerA, sellerB] = await db.select().from(schema.users).limit(2);
  if (!sellerA) {
    throw new Error(
      "No users found in the `users` table. Log in once via the app first " +
        "(the auth.users sync trigger creates the matching public.users row), " +
        "then re-run this script.",
    );
  }
  const sellers = [sellerA, sellerB ?? sellerA];

  for (const [index, ad] of dummyAds.entries()) {
    const seller = sellers[index % sellers.length];
    const createdAt = new Date(now - ad.createdAtDaysAgo * DAY_MS);
    const tierExpiresAt =
      ad.listingTier === "standard"
        ? null
        : new Date(now + 14 * DAY_MS);

    await db
      .insert(schema.ads)
      .values({
        id: ad.id,
        userId: seller.id,
        categoryId: ad.categoryId,
        locationId: ad.locationId,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        isNegotiable: ad.isNegotiable,
        condition: ad.condition,
        status: "active",
        listingTier: ad.listingTier,
        tierExpiresAt,
        publishedAt: createdAt,
        createdAt,
      })
      .onConflictDoUpdate({
        target: schema.ads.id,
        set: {
          title: ad.title,
          description: ad.description,
          price: ad.price,
          isNegotiable: ad.isNegotiable,
          condition: ad.condition,
          status: "active",
          listingTier: ad.listingTier,
          tierExpiresAt,
        },
      });

    const [existingImage] = await db
      .select()
      .from(schema.adImages)
      .where(eq(schema.adImages.adId, ad.id));
    if (!existingImage) {
      await db.insert(schema.adImages).values({
        id: `${ad.id}-img`,
        adId: ad.id,
        cloudinaryPublicId: ad.image,
        sortOrder: 0,
      });
    }
  }

  console.log(`Seeded ${dummyAds.length} dummy ads across 2 sellers.`);
}

try {
  await main();
} finally {
  await client.end({ timeout: 1 });
}
