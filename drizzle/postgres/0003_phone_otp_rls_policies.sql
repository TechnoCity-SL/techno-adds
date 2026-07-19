-- Row Level Security for the phone-verification tables (Phase 1).
-- Test case for every policy below: "can user A read/write user B's row?" (CLAUDE.md §5).

-- user_phone_numbers: unlike users.display_name/avatar, a phone number is PII —
-- no public read. Owner-only for every operation.
alter table "user_phone_numbers" enable row level security;

create policy "user_phone_numbers_select_own" on "user_phone_numbers"
  for select
  using (auth.uid()::text = user_id);

create policy "user_phone_numbers_insert_own" on "user_phone_numbers"
  for insert
  with check (auth.uid()::text = user_id);

create policy "user_phone_numbers_update_own" on "user_phone_numbers"
  for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create policy "user_phone_numbers_delete_own" on "user_phone_numbers"
  for delete
  using (auth.uid()::text = user_id);

-- otp_codes: never exposed to `anon`/`authenticated` at all — otp_hash and attempt
-- counts are only ever read/written by server-side route handlers using the
-- Supabase secret key (which bypasses RLS entirely). RLS enabled, deliberately
-- with zero policies for client roles, so any client-role access is denied by default.
alter table "otp_codes" enable row level security;
