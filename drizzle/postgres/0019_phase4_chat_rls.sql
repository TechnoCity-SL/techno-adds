-- Row Level Security for Phase 4 tables (chat, saved searches, reports).
-- Test case for every policy below: "can user A read/write user B's row?" (CLAUDE.md §5).

-- conversations: only the buyer or seller in a conversation can see it. Only the
-- buyer can start one (matches app-level get-or-create in lib/chat, which also
-- rejects a seller starting a conversation on their own ad). No update/delete
-- policy: conversations are immutable once created, same reasoning as
-- moderation_actions being an append-only log.
alter table "conversations" enable row level security;

create policy "conversations_select_participant" on "conversations"
  for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "conversations_insert_as_buyer" on "conversations"
  for insert
  with check (auth.uid() = buyer_id);

-- messages: visibility and write access mirror the parent conversation's
-- participants, same "via parent" pattern as ad_attribute_values/ad_images
-- mirroring ads. No update/delete: messages are immutable once sent.
alter table "messages" enable row level security;

create policy "messages_select_participant" on "messages"
  for select
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and (auth.uid() = conversations.buyer_id or auth.uid() = conversations.seller_id)
    )
  );

create policy "messages_insert_participant" on "messages"
  for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and (auth.uid() = conversations.buyer_id or auth.uid() = conversations.seller_id)
    )
  );

-- saved_searches: private to the owner, full CRUD (create/list/toggle notify/delete
-- all happen from the owner's own "Saved searches" UI) — same shape as favorites.
alter table "saved_searches" enable row level security;

create policy "saved_searches_select_own" on "saved_searches"
  for select
  using (auth.uid() = user_id);

create policy "saved_searches_insert_own" on "saved_searches"
  for insert
  with check (auth.uid() = user_id);

create policy "saved_searches_update_own" on "saved_searches"
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saved_searches_delete_own" on "saved_searches"
  for delete
  using (auth.uid() = user_id);

-- reports: a reporter can file a report and see their own submissions. No
-- update/delete (a filed report shouldn't be editable/withdrawable by the
-- reporter) and no moderator SELECT policy: the moderation review queue is
-- read through the backend's plain `postgres` role, which bypasses RLS
-- entirely (see CLAUDE.md §4 RLS-bypass finding) — same reasoning that kept
-- moderation_actions free of a moderator-role policy.
alter table "reports" enable row level security;

create policy "reports_select_own" on "reports"
  for select
  using (auth.uid() = reporter_user_id);

create policy "reports_insert_own" on "reports"
  for insert
  with check (auth.uid() = reporter_user_id);
