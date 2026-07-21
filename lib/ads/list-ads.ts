import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/postgres-client";

/**
 * websearch_to_tsquery/tsvector is the primary search mechanism (PLAN.md §4.1:
 * "Postgres full-text search (tsvector) at MVP"), not pg_trgm — confirmed by
 * testing that trigram similarity() scores a short misspelled query against a
 * full title too low to clear the default 0.3 threshold (e.g. "Toyta" vs.
 * "Toyota Aqua Hybrid 2015" scored 0.15). The trigram index stays installed
 * (see drizzle/postgres/0012_ads_full_text_search.sql) for future typo-tolerant
 * features (autocomplete, "did you mean"), but isn't wired into ranked search
 * without further tuning (word_similarity, lower threshold) that's out of
 * scope for MVP browse/search.
 */

export type AdSort = "newest" | "price_asc" | "price_desc" | "relevance";

export interface ListAdsParams {
  categoryId?: string;
  locationId?: string;
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: AdSort;
  minPrice?: number;
  maxPrice?: number;
  /** Matches lib/validation/ads.ts's createAdSchema condition enum. */
  condition?: ("new" | "used")[];
}

export interface AdListItem {
  id: string;
  title: string;
  price: number;
  isNegotiable: boolean;
  condition: string;
  categoryId: string;
  locationId: string;
  locationName: string | null;
  createdAt: Date;
  thumbnailPublicId: string | null;
  listingTier: string;
}

interface AdRow {
  id: string;
  title: string;
  price: string;
  is_negotiable: boolean;
  condition: string;
  category_id: string;
  location_id: string;
  location_name: string | null;
  created_at: Date;
  thumbnail_public_id: string | null;
  listing_tier: string;
}

function mapRow(r: AdRow): AdListItem {
  return {
    id: r.id,
    title: r.title,
    price: Number(r.price),
    isNegotiable: r.is_negotiable,
    condition: r.condition,
    categoryId: r.category_id,
    locationId: r.location_id,
    locationName: r.location_name,
    createdAt: r.created_at,
    thumbnailPublicId: r.thumbnail_public_id,
    listingTier: r.listing_tier,
  };
}

/**
 * Super Ad's "featured carousel" placement (PLAN.md §10) — a small row of
 * currently-boosted-to-super ads in a category, shown above the main grid.
 * No homepage exists yet to put a site-wide version of this on (app/page.tsx
 * is still the default Next.js starter page, a separate not-yet-scheduled
 * gap), so this is scoped to category listing pages only for now.
 */
export async function listFeaturedAds(
  categoryId?: string,
  limit = 4,
): Promise<AdListItem[]> {
  const categorySql = categoryId
    ? sql`and a.category_id = ${categoryId}`
    : sql``;
  const rows = (await db.execute(sql`
    select a.id, a.title, a.price, a.is_negotiable, a.condition, a.category_id, a.location_id,
      l.name as location_name, a.created_at,
      (select ai.cloudinary_public_id from ad_images ai where ai.ad_id = a.id order by ai.sort_order asc limit 1) as thumbnail_public_id,
      a.listing_tier
    from ads a
    left join locations l on l.id = a.location_id
    where a.status = 'active'
      ${categorySql}
      and a.listing_tier = 'super'
      and a.tier_expires_at > now()
    order by a.tier_expires_at desc
    limit ${limit}
  `)) as unknown as AdRow[];

  return rows.map(mapRow);
}

export async function listAds(params: ListAdsParams): Promise<{
  ads: AdListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, params.pageSize ?? 20);
  const offset = (page - 1) * pageSize;

  const conditions = [sql`a.status = 'active'`];
  if (params.categoryId)
    conditions.push(sql`a.category_id = ${params.categoryId}`);
  if (params.locationId)
    conditions.push(sql`a.location_id = ${params.locationId}`);
  if (params.query)
    conditions.push(
      sql`a.search_vector @@ websearch_to_tsquery('english', ${params.query})`,
    );
  if (params.minPrice !== undefined)
    conditions.push(sql`a.price >= ${params.minPrice}`);
  if (params.maxPrice !== undefined)
    conditions.push(sql`a.price <= ${params.maxPrice}`);
  if (params.condition && params.condition.length > 0) {
    conditions.push(
      sql`a.condition in (${sql.join(
        params.condition.map((c) => sql`${c}`),
        sql`, `,
      )})`,
    );
  }

  const whereSql = sql.join(conditions, sql` and `);

  let orderSql = sql`a.created_at desc`;
  if (params.sort === "price_asc") orderSql = sql`a.price asc`;
  else if (params.sort === "price_desc") orderSql = sql`a.price desc`;
  else if (params.sort === "relevance" && params.query) {
    orderSql = sql`ts_rank(a.search_vector, websearch_to_tsquery('english', ${params.query})) desc`;
  }

  // Boosted ads are pinned above standard results (PLAN.md §10), super above
  // top, each group otherwise keeping the requested sort. Computed from
  // tier_expires_at here rather than trusting listing_tier alone, so pinning
  // stays correct even in the window between a boost actually expiring and
  // the periodic tier-expiry job (lib/payments/expire-tiers.ts) getting
  // around to demoting the column back to "standard".
  const tierRankSql = sql`
    case
      when a.tier_expires_at > now() and a.listing_tier = 'super' then 0
      when a.tier_expires_at > now() and a.listing_tier = 'top' then 1
      else 2
    end`;

  const rows = (await db.execute(sql`
    select a.id, a.title, a.price, a.is_negotiable, a.condition, a.category_id, a.location_id,
      l.name as location_name, a.created_at,
      (select ai.cloudinary_public_id from ad_images ai where ai.ad_id = a.id order by ai.sort_order asc limit 1) as thumbnail_public_id,
      case when a.tier_expires_at > now() then a.listing_tier else 'standard' end as listing_tier
    from ads a
    left join locations l on l.id = a.location_id
    where ${whereSql}
    order by ${tierRankSql}, ${orderSql}
    limit ${pageSize} offset ${offset}
  `)) as unknown as AdRow[];

  const countRows = (await db.execute(
    sql`select count(*) as total from ads a where ${whereSql}`,
  )) as unknown as {
    total: string;
  }[];
  const total = Number(countRows[0]?.total ?? 0);

  return {
    ads: rows.map(mapRow),
    total,
    page,
    pageSize,
  };
}
