-- Keeps public.users in sync with Supabase's auth.users, regardless of signup
-- method (Google, Facebook, email/password). Without this, a fresh login has
-- a session but no row in public.users, which the rest of the app schema
-- (ads.user_id, user_phone_numbers.user_id, etc.) requires. See PLAN.md §5.1:
-- "users.id (=auth.users.id)".
--
-- security definer: this trigger fires from Supabase's internal auth service
-- context, not the signed-in user's own role — security definer makes it run
-- with the function owner's privileges so the insert isn't blocked by RLS.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
