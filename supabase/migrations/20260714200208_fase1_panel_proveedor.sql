-- Fase 1 — Panel proveedor completo (PLAN.md §1) + endurecimiento de Storage.

-- 1. providers.status ahora acepta 'pending' (auto-registro pendiente de aprobación)
alter table providers drop constraint if exists providers_status_check;
alter table providers
  add constraint providers_status_check
  check (status in ('draft', 'pending', 'published', 'claimed'));

-- Predicado de dueño reutilizado por las policies de las tablas nuevas
create or replace function public.owns_provider(pid uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from providers p
    where p.id = pid and p.claimed_by = (select auth.uid())
  );
$$;

create or replace function public.provider_is_public(pid uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from providers p
    where p.id = pid and p.status in ('published', 'claimed')
  );
$$;

-- 2. service_packages
create table service_packages (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  name text not null,
  description text,
  price_from numeric,
  price_to numeric,
  price_unit text check (price_unit in ('por_evento', 'por_hora', 'por_persona')),
  includes text[],
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger service_packages_updated_at
  before update on service_packages
  for each row execute function update_updated_at();

-- 3. provider_media — se guarda bucket + object path (no URLs firmadas);
--    url se conserva para compat con el catálogo público (buckets públicos).
create table provider_media (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  type text not null check (type in ('photo', 'audio', 'video')),
  bucket text not null default 'provider-photos',
  path text not null,
  url text not null,
  title text,
  alt_text text,
  mime_type text,
  size_bytes bigint,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  unique (bucket, path)
);

-- 4. venue_details (1-a-1 con providers, categoría salones)
create table venue_details (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references providers(id) on delete cascade,
  capacity_min int,
  capacity_max int,
  address text,
  indoor boolean,
  outdoor boolean,
  parking boolean,
  catering_allowed boolean,
  amenities text[],
  floor_plan_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger venue_details_updated_at
  before update on venue_details
  for each row execute function update_updated_at();

-- 5. catering_menus + items (categoría banquete)
create table catering_menus (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  name text not null,
  description text,
  price_per_person numeric,
  min_guests int,
  event_types text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger catering_menus_updated_at
  before update on catering_menus
  for each row execute function update_updated_at();

create table catering_menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references catering_menus(id) on delete cascade,
  course text check (course in ('entrada', 'sopa', 'plato_principal', 'postre', 'bebidas', 'extras')),
  name text not null,
  description text,
  sort_order int not null default 0
);

-- 6. provider_availability
create table provider_availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  date date not null,
  status text not null check (status in ('available', 'booked', 'tentative')),
  note text,
  created_at timestamptz default now(),
  unique (provider_id, date)
);

-- 7. inquiries
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  event_type text,
  event_date date,
  guest_count int,
  message text,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger inquiries_updated_at
  before update on inquiries
  for each row execute function update_updated_at();

-- Índices FK
create index service_packages_provider_idx on service_packages(provider_id, sort_order);
create index provider_media_provider_idx on provider_media(provider_id, type, sort_order);
create index catering_menus_provider_idx on catering_menus(provider_id);
create index catering_menu_items_menu_idx on catering_menu_items(menu_id, sort_order);
create index provider_availability_provider_idx on provider_availability(provider_id, date);
create index inquiries_provider_idx on inquiries(provider_id, status, created_at desc);

-- RLS
alter table service_packages enable row level security;
alter table provider_media enable row level security;
alter table venue_details enable row level security;
alter table catering_menus enable row level security;
alter table catering_menu_items enable row level security;
alter table provider_availability enable row level security;
alter table inquiries enable row level security;

-- Data API grants
grant select on service_packages, provider_media, venue_details, catering_menus, catering_menu_items to anon, authenticated;
grant insert, update, delete on service_packages, provider_media, venue_details, catering_menus, catering_menu_items, provider_availability to authenticated;
grant select on provider_availability to authenticated;
grant insert on inquiries to anon, authenticated;
grant select, update on inquiries to authenticated;

-- Policies: público lee contenido de proveedores publicados; el dueño hace CRUD; admin todo.
-- service_packages
create policy "packages_public_read" on service_packages
  for select to anon, authenticated using (provider_is_public(provider_id));
create policy "packages_owner_all" on service_packages
  for all to authenticated
  using (owns_provider(provider_id)) with check (owns_provider(provider_id));
create policy "packages_admin_all" on service_packages
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- provider_media
create policy "media_public_read" on provider_media
  for select to anon, authenticated using (provider_is_public(provider_id));
create policy "media_owner_all" on provider_media
  for all to authenticated
  using (owns_provider(provider_id)) with check (owns_provider(provider_id));
create policy "media_admin_all" on provider_media
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- venue_details
create policy "venue_public_read" on venue_details
  for select to anon, authenticated using (provider_is_public(provider_id));
create policy "venue_owner_all" on venue_details
  for all to authenticated
  using (owns_provider(provider_id)) with check (owns_provider(provider_id));
create policy "venue_admin_all" on venue_details
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- catering_menus
create policy "menus_public_read" on catering_menus
  for select to anon, authenticated using (provider_is_public(provider_id));
create policy "menus_owner_all" on catering_menus
  for all to authenticated
  using (owns_provider(provider_id)) with check (owns_provider(provider_id));
create policy "menus_admin_all" on catering_menus
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- catering_menu_items (hereda visibilidad del menú padre)
create policy "menu_items_public_read" on catering_menu_items
  for select to anon, authenticated
  using (exists (
    select 1 from catering_menus m
    where m.id = menu_id and provider_is_public(m.provider_id)
  ));
create policy "menu_items_owner_all" on catering_menu_items
  for all to authenticated
  using (exists (
    select 1 from catering_menus m
    where m.id = menu_id and owns_provider(m.provider_id)
  ))
  with check (exists (
    select 1 from catering_menus m
    where m.id = menu_id and owns_provider(m.provider_id)
  ));
create policy "menu_items_admin_all" on catering_menu_items
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- provider_availability (privado del dueño en Fase 1; la nota nunca es pública)
create policy "availability_owner_all" on provider_availability
  for all to authenticated
  using (owns_provider(provider_id)) with check (owns_provider(provider_id));
create policy "availability_admin_all" on provider_availability
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- inquiries: cualquiera puede enviar; el dueño lee y actualiza estado
create policy "inquiries_insert_all" on inquiries
  for insert to anon, authenticated with check (true);
create policy "inquiries_owner_read" on inquiries
  for select to authenticated using (owns_provider(provider_id));
create policy "inquiries_owner_update" on inquiries
  for update to authenticated
  using (owns_provider(provider_id)) with check (owns_provider(provider_id));
create policy "inquiries_admin_all" on inquiries
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 8. Storage ------------------------------------------------------------------
-- Buckets públicos: las fotos/medios pertenecen a perfiles públicos del catálogo.
-- La escritura queda restringida por carpeta: {provider_id}/... solo para el dueño.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-photos',
  'provider-photos',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-media',
  'provider-media',
  true,
  52428800, -- 50MB (audio; video pesado queda para una fase posterior)
  array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'video/mp4']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- El primer folder del object path debe ser el provider_id del dueño autenticado.
create or replace function public.owns_storage_folder(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from providers p
    where p.claimed_by = (select auth.uid())
      and p.id::text = (storage.foldername(object_name))[1]
  );
$$;

-- Reemplaza las policies previas basadas solo en rol (permitían escribir en
-- cualquier path del bucket y sobrescribir archivos ajenos con upsert).
drop policy if exists "provider_photos_public_read" on storage.objects;
drop policy if exists "provider_photos_authenticated_insert" on storage.objects;
drop policy if exists "provider_photos_authenticated_update" on storage.objects;
drop policy if exists "provider_photos_authenticated_delete" on storage.objects;

create policy "provider_buckets_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('provider-photos', 'provider-media'));

create policy "provider_buckets_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('provider-photos', 'provider-media')
  and (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or owns_storage_folder(name)
  )
);

create policy "provider_buckets_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id in ('provider-photos', 'provider-media')
  and (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or owns_storage_folder(name)
  )
)
with check (
  bucket_id in ('provider-photos', 'provider-media')
  and (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or owns_storage_folder(name)
  )
);

create policy "provider_buckets_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('provider-photos', 'provider-media')
  and (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or owns_storage_folder(name)
  )
);
