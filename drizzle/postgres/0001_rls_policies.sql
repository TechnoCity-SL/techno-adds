-- Row Level Security for Phase 0 core tables.
-- Test case for every policy below: "can user A read/write user B's row?" (CLAUDE.md §5).
-- `is_moderator` overrides (Phase 5, moderation) are not modeled yet — deliberately deferred,
-- not forgotten: there is no moderator role/claim in the system yet, so writing an override
-- for it now would be untestable dead code.

-- users: display_name/avatar/trust_score/is_pro_seller are public-facing (shown on ad
-- cards as seller info), so SELECT is open. Writes are restricted to the row's own owner.
alter table "users" enable row level security;

create policy "users_select_all" on "users"
  for select
  using (true);

create policy "users_insert_own" on "users"
  for insert
  with check (auth.uid()::text = id);

create policy "users_update_own" on "users"
  for update
  using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

create policy "users_delete_own" on "users"
  for delete
  using (auth.uid()::text = id);

-- categories, locations: reference/lookup data seeded and maintained by admin tooling
-- (service_role, which bypasses RLS entirely) — public read, no client-writable policy.
alter table "categories" enable row level security;

create policy "categories_select_all" on "categories"
  for select
  using (true);

alter table "locations" enable row level security;

create policy "locations_select_all" on "locations"
  for select
  using (true);

-- ads: anyone can browse active ads; an owner can also see their own ad regardless of
-- status (draft/pending/rejected) to manage it from "My Ads". Only the owner can write.
alter table "ads" enable row level security;

create policy "ads_select_active_or_own" on "ads"
  for select
  using (status = 'active' or auth.uid()::text = user_id);

create policy "ads_insert_own" on "ads"
  for insert
  with check (auth.uid()::text = user_id);

create policy "ads_update_own" on "ads"
  for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create policy "ads_delete_own" on "ads"
  for delete
  using (auth.uid()::text = user_id);
