-- Integration hardening for public tracking, admin claim links, and photo uploads.

-- Claimed profiles are active public profiles in the current MVP flow.
drop policy if exists "providers_public_read" on providers;
create policy "providers_public_read" on providers
  for select to anon, authenticated using (status in ('published', 'claimed'));

-- Claim links are looked up by token and must never collide.
create unique index if not exists claim_tokens_token_idx on claim_tokens(token);
create index if not exists claim_tokens_provider_id_idx on claim_tokens(provider_id);

-- Common read paths for listings, sitemap, dashboards, and provider analytics.
create index if not exists providers_status_category_idx on providers(status, category_id);
create index if not exists providers_claimed_by_idx on providers(claimed_by);
create index if not exists providers_created_at_idx on providers(created_at desc);
create index if not exists leads_provider_created_at_idx on leads(provider_id, created_at desc);
create index if not exists leads_type_created_at_idx on leads(type, created_at desc);

-- Supabase Storage bucket used by src/components/admin/photo-uploader.tsx.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-photos',
  'provider-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "provider_photos_public_read" on storage.objects;
create policy "provider_photos_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'provider-photos');

drop policy if exists "provider_photos_authenticated_insert" on storage.objects;
create policy "provider_photos_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'provider-photos'
  and (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'provider')
  )
);

drop policy if exists "provider_photos_authenticated_update" on storage.objects;
create policy "provider_photos_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'provider-photos'
  and (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'provider')
  )
)
with check (
  bucket_id = 'provider-photos'
  and (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'provider')
  )
);

drop policy if exists "provider_photos_authenticated_delete" on storage.objects;
create policy "provider_photos_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'provider-photos'
  and (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'provider')
  )
);
