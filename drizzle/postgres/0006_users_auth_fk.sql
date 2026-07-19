-- Makes account deletion (Supabase Auth admin API, or a future "delete
-- account" feature) actually clean up public.users too, instead of leaving
-- PII/orphaned rows behind — found by testing (see 0005's migration comment
-- for the type-mismatch bug this surfaced first). Relevant for PDPA
-- compliance (PLAN.md §12).
--
-- Deliberately NOT cascaded further to ads/user_phone_numbers here — whether
-- a user's ads should hard-delete, soft-delete, or be reassigned on account
-- deletion is a product decision for the "delete account" feature itself
-- (not built yet), not something to decide implicitly via an FK constraint.
alter table "users"
  add constraint "users_id_auth_users_fk"
  foreign key ("id") references auth.users(id)
  on delete cascade;
