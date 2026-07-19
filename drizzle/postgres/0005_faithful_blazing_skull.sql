-- drizzle-kit generated a bare `SET DATA TYPE uuid` with no cast, which Postgres
-- rejects (text -> uuid has no implicit/assignment cast) — added `USING` by hand.
--
-- Also had to drop and recreate every RLS policy that references these columns:
-- Postgres refuses to retype a column a policy depends on. While recreating them,
-- the `::text` cast on `auth.uid()` is removed — it was only needed because
-- user_id/id used to be `text`; now both sides are natively `uuid`.
drop policy if exists "users_insert_own" on "users";
drop policy if exists "users_update_own" on "users";
drop policy if exists "users_delete_own" on "users";
drop policy if exists "ads_select_active_or_own" on "ads";
drop policy if exists "ads_insert_own" on "ads";
drop policy if exists "ads_update_own" on "ads";
drop policy if exists "ads_delete_own" on "ads";
drop policy if exists "user_phone_numbers_select_own" on "user_phone_numbers";
drop policy if exists "user_phone_numbers_insert_own" on "user_phone_numbers";
drop policy if exists "user_phone_numbers_update_own" on "user_phone_numbers";
drop policy if exists "user_phone_numbers_delete_own" on "user_phone_numbers";
--> statement-breakpoint

ALTER TABLE "ads" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "user_phone_numbers" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint

create policy "users_insert_own" on "users"
  for insert
  with check (auth.uid() = id);

create policy "users_update_own" on "users"
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users_delete_own" on "users"
  for delete
  using (auth.uid() = id);

create policy "ads_select_active_or_own" on "ads"
  for select
  using (status = 'active' or auth.uid() = user_id);

create policy "ads_insert_own" on "ads"
  for insert
  with check (auth.uid() = user_id);

create policy "ads_update_own" on "ads"
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ads_delete_own" on "ads"
  for delete
  using (auth.uid() = user_id);

create policy "user_phone_numbers_select_own" on "user_phone_numbers"
  for select
  using (auth.uid() = user_id);

create policy "user_phone_numbers_insert_own" on "user_phone_numbers"
  for insert
  with check (auth.uid() = user_id);

create policy "user_phone_numbers_update_own" on "user_phone_numbers"
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_phone_numbers_delete_own" on "user_phone_numbers"
  for delete
  using (auth.uid() = user_id);
