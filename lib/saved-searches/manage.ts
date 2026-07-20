import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/postgres-client";

export interface SavedSearchItem {
  id: string;
  query: string;
  notifyEnabled: boolean;
  lastNotifiedAt: Date | null;
  createdAt: Date;
}

// queryParams is a JSON-serialized string, not jsonb — same portability
// reasoning as category_attributes.options (PLAN.md §4.1/v1.3). Only `q`
// (the /search page's free-text query) is captured for now — category/
// location browsing lives on separate routes ([categorySlug]/[locationSlug]),
// not query params, so there's nothing else to save yet.
function parseQueryParams(raw: string): { q: string } {
  return JSON.parse(raw) as { q: string };
}

export async function createSavedSearch(
  userId: string,
  q: string,
): Promise<string> {
  const id = randomUUID();
  await db.insert(schema.savedSearches).values({
    id,
    userId,
    queryParams: JSON.stringify({ q }),
  });
  return id;
}

export async function listSavedSearches(
  userId: string,
): Promise<SavedSearchItem[]> {
  const rows = await db
    .select()
    .from(schema.savedSearches)
    .where(eq(schema.savedSearches.userId, userId))
    .orderBy(desc(schema.savedSearches.createdAt));

  return rows.map((r) => ({
    id: r.id,
    query: parseQueryParams(r.queryParams).q,
    notifyEnabled: r.notifyEnabled,
    lastNotifiedAt: r.lastNotifiedAt,
    createdAt: r.createdAt,
  }));
}

// userId scoping here (not just the RLS delete-own policy) is the real
// enforcement — our Postgres client bypasses RLS entirely (CLAUDE.md rule #4).
export async function deleteSavedSearch(
  userId: string,
  id: string,
): Promise<void> {
  await db
    .delete(schema.savedSearches)
    .where(
      and(
        eq(schema.savedSearches.id, id),
        eq(schema.savedSearches.userId, userId),
      ),
    );
}
