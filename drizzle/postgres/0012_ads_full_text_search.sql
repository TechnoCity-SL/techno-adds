-- Postgres-only full-text search (PLAN.md §4.1: "Postgres full-text search
-- (tsvector) at MVP"). Not represented in lib/db/schema/postgres.ts, same
-- reasoning as RLS policies — Drizzle's schema DSL doesn't need to know about
-- a generated column the app never writes to directly; queries reference it
-- via raw sql`` fragments instead. No SQLite equivalent (search stays
-- Postgres-only, consistent with every other Postgres-only feature so far).
create extension if not exists pg_trgm;

alter table "ads" add column "search_vector" tsvector generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) stored;

create index "ads_search_vector_idx" on "ads" using gin ("search_vector");
create index "ads_title_trgm_idx" on "ads" using gin ("title" gin_trgm_ops);
