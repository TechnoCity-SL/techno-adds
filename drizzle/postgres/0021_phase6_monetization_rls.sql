-- Row Level Security for Phase 6 tables (monetization/payments).
-- Test case for every policy below: "can user A read/write user B's row?" (CLAUDE.md §5).

-- listing_products: the rate card is reference data seeded/maintained by
-- admin tooling (service_role, which bypasses RLS entirely) — same pattern
-- as categories/category_attributes. Public read, no client-writable policy.
alter table "listing_products" enable row level security;

create policy "listing_products_select_all" on "listing_products"
  for select
  using (true);

-- orders: a buyer can see and create their own orders. No update/delete
-- policy for client roles — status transitions (paid/awaiting_confirmation/
-- failed) only ever happen server-side, via the PayHere webhook handler or a
-- moderator's manual bank-transfer review, both of which go through our
-- Postgres client (plain `postgres` role) which bypasses RLS anyway
-- (CLAUDE.md §4) — a client-writable status column would be a real
-- payment-integrity hole, not just redundant.
alter table "orders" enable row level security;

create policy "orders_select_own" on "orders"
  for select
  using (auth.uid() = user_id);

create policy "orders_insert_own" on "orders"
  for insert
  with check (auth.uid() = user_id);

-- payment_transactions: PayHere's raw signed notify payloads — never exposed
-- to any client role, same pattern as moderation_actions/otp_codes. RLS
-- enabled, deliberately zero policies so only the server/service-role can
-- ever touch it.
alter table "payment_transactions" enable row level security;

-- bank_transfer_proofs: visibility and write access mirror the parent
-- order's owner (the buyer who's paying), same "via parent" EXISTS-subquery
-- pattern as ad_attribute_values/ad_images mirroring ads. No update/delete:
-- once a receipt is uploaded it shouldn't be alterable by the uploader.
-- Moderator review (reviewedByModeratorId/reviewedAt) is a server-side write
-- through the Postgres-role bypass, same as every other moderation action.
alter table "bank_transfer_proofs" enable row level security;

create policy "bank_transfer_proofs_select_via_order" on "bank_transfer_proofs"
  for select
  using (
    exists (
      select 1 from orders
      where orders.id = bank_transfer_proofs.order_id
        and auth.uid() = orders.user_id
    )
  );

create policy "bank_transfer_proofs_insert_via_order" on "bank_transfer_proofs"
  for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = bank_transfer_proofs.order_id
        and auth.uid() = orders.user_id
    )
  );
