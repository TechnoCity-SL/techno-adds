-- moderation_actions is an audit log — never exposed to `anon`/`authenticated`
-- at all, same pattern as otp_codes: RLS enabled, deliberately zero policies
-- for client roles, so only the server/service-role can ever touch it.
alter table "moderation_actions" enable row level security;
