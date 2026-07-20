-- favorites: a user's saved list is private, owner-only for every operation.
-- Test case: "can user A read/write user B's row?" (CLAUDE.md §5).
alter table "favorites" enable row level security;

create policy "favorites_select_own" on "favorites"
  for select
  using (auth.uid() = user_id);

create policy "favorites_insert_own" on "favorites"
  for insert
  with check (auth.uid() = user_id);

create policy "favorites_delete_own" on "favorites"
  for delete
  using (auth.uid() = user_id);
