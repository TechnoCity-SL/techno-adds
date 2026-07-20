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
}

export interface AdListItem {
  id: string;
  title: string;
  price: number;
  isNegotiable: boolean;
  condition: string;
  categoryId: string;
  locationId: string;
  createdAt: Date;
  thumbnailPublicId: string | null;
}

interface AdRow {
  id: string;
  title: string;
  price: string;
  is_negotiable: boolean;
  condition: string;
  category_id: string;
  location_id: string;
  created_at: Date;
  thumbnail_public_id: string | null;
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

  const whereSql = sql.join(conditions, sql` and `);

  let orderSql = sql`a.created_at desc`;
  if (params.sort === "price_asc") orderSql = sql`a.price asc`;
  else if (params.sort === "price_desc") orderSql = sql`a.price desc`;
  else if (params.sort === "relevance" && params.query) {
    orderSql = sql`ts_rank(a.search_vector, websearch_to_tsquery('english', ${params.query})) desc`;
  }

  const rows = (await db.execute(sql`
    select a.id, a.title, a.price, a.is_negotiable, a.condition, a.category_id, a.location_id, a.created_at,
      (select ai.cloudinary_public_id from ad_images ai where ai.ad_id = a.id order by ai.sort_order asc limit 1) as thumbnail_public_id
    from ads a
    where ${whereSql}
    order by ${orderSql}
    limit ${pageSize} offset ${offset}
  `)) as unknown as AdRow[];

  const countRows = (await db.execute(
    sql`select count(*) as total from ads a where ${whereSql}`,
  )) as unknown as {
    total: string;
  }[];
  const total = Number(countRows[0]?.total ?? 0);

  return {
    ads: rows.map((r) => ({
      id: r.id,
      title: r.title,
      price: Number(r.price),
      isNegotiable: r.is_negotiable,
      condition: r.condition,
      categoryId: r.category_id,
      locationId: r.location_id,
      createdAt: r.created_at,
      thumbnailPublicId: r.thumbnail_public_id,
    })),
    total,
    page,
    pageSize,
  };
}
