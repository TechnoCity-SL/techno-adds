-- Row Level Security for Phase 2 tables.
-- Test case for every policy below: "can user A read/write user B's row?" (CLAUDE.md §5).

-- category_attributes: reference data (attribute definitions per category),
-- same pattern as categories/locations — public read, admin/service_role-only writes.
alter table "category_attributes" enable row level security;

create policy "category_attributes_select_all" on "category_attributes"
  for select
  using (true);

-- ad_attribute_values / ad_images: visibility and write access mirror the
-- parent ad exactly (public if the ad is active, owner otherwise; only the
-- ad's owner can write) — enforced via a subquery against ads, since these
-- rows don't carry a user_id of their own.
alter table "ad_attribute_values" enable row level security;

create policy "ad_attribute_values_select_via_ad" on "ad_attribute_values"
  for select
  using (
    exists (
      select 1 from ads
      where ads.id = ad_attribute_values.ad_id
        and (ads.status = 'active' or auth.uid() = ads.user_id)
    )
  );

create policy "ad_attribute_values_insert_via_ad" on "ad_attribute_values"
  for insert
  with check (
    exists (select 1 from ads where ads.id = ad_attribute_values.ad_id and auth.uid() = ads.user_id)
  );

create policy "ad_attribute_values_update_via_ad" on "ad_attribute_values"
  for update
  using (
    exists (select 1 from ads where ads.id = ad_attribute_values.ad_id and auth.uid() = ads.user_id)
  )
  with check (
    exists (select 1 from ads where ads.id = ad_attribute_values.ad_id and auth.uid() = ads.user_id)
  );

create policy "ad_attribute_values_delete_via_ad" on "ad_attribute_values"
  for delete
  using (
    exists (select 1 from ads where ads.id = ad_attribute_values.ad_id and auth.uid() = ads.user_id)
  );

alter table "ad_images" enable row level security;

create policy "ad_images_select_via_ad" on "ad_images"
  for select
  using (
    exists (
      select 1 from ads
      where ads.id = ad_images.ad_id
        and (ads.status = 'active' or auth.uid() = ads.user_id)
    )
  );

create policy "ad_images_insert_via_ad" on "ad_images"
  for insert
  with check (
    exists (select 1 from ads where ads.id = ad_images.ad_id and auth.uid() = ads.user_id)
  );

create policy "ad_images_update_via_ad" on "ad_images"
  for update
  using (
    exists (select 1 from ads where ads.id = ad_images.ad_id and auth.uid() = ads.user_id)
  )
  with check (
    exists (select 1 from ads where ads.id = ad_images.ad_id and auth.uid() = ads.user_id)
  );

create policy "ad_images_delete_via_ad" on "ad_images"
  for delete
  using (
    exists (select 1 from ads where ads.id = ad_images.ad_id and auth.uid() = ads.user_id)
  );
