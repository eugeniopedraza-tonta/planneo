-- Baseline consolidado del schema MVP (reemplaza las migraciones 20260528* eliminadas
-- del working tree; contenido tomado de git @ 4ca9aad sin cambios funcionales).
-- Las políticas de Storage se definen en la migración fase1 con reglas por dueño.

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon_url text
);

-- Providers
create table providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid references categories(id),
  status text not null default 'draft' check (status in ('draft', 'published', 'claimed')),
  claimed_by uuid references auth.users(id),
  whatsapp text,
  email text,
  description text,
  zona text,
  event_types text[],
  photos text[],
  instagram_handle text,
  price_range text check (price_range in ('$', '$$', '$$$')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function update_updated_at()
returns trigger language plpgsql security invoker as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger providers_updated_at
  before update on providers
  for each row execute function update_updated_at();

-- Leads (North Star metric)
create table leads (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id),
  type text not null check (type in ('whatsapp_click', 'profile_view')),
  session_id text,
  referrer text,
  created_at timestamptz default now()
);

-- Claim tokens
create table claim_tokens (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id),
  token uuid not null default gen_random_uuid(),
  expires_at timestamptz not null,
  used_at timestamptz
);

-- RLS
alter table categories enable row level security;
alter table providers enable row level security;
alter table leads enable row level security;
alter table claim_tokens enable row level security;

-- Data API grants
grant select on categories to anon, authenticated;
grant select on providers to anon, authenticated;
grant insert on leads to anon, authenticated;
grant select on leads to authenticated;

-- Categories policies
create policy "categories_public_read" on categories
  for select to anon, authenticated using (true);

create policy "categories_admin_write" on categories
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Providers policies (claimed = perfil público activo en el MVP)
create policy "providers_public_read" on providers
  for select to anon, authenticated using (status in ('published', 'claimed'));

create policy "providers_admin_all" on providers
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "providers_owner_read" on providers
  for select to authenticated
  using (claimed_by = (select auth.uid()));

create policy "providers_owner_update" on providers
  for update to authenticated
  using (claimed_by = (select auth.uid()))
  with check (claimed_by = (select auth.uid()));

-- Leads policies
create policy "leads_insert_all" on leads
  for insert to anon, authenticated with check (true);

create policy "leads_admin_read" on leads
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "leads_provider_read" on leads
  for select to authenticated
  using (
    provider_id in (
      select id from providers where claimed_by = (select auth.uid())
    )
  );

-- Claim tokens policies
create policy "claim_tokens_admin_all" on claim_tokens
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Full-text search
alter table providers add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored;

create index if not exists providers_search_idx on providers using gin(search_vector);

-- Índices de rutas de lectura comunes
create unique index if not exists claim_tokens_token_idx on claim_tokens(token);
create index if not exists claim_tokens_provider_id_idx on claim_tokens(provider_id);
create index if not exists providers_status_category_idx on providers(status, category_id);
create index if not exists providers_claimed_by_idx on providers(claimed_by);
create index if not exists providers_created_at_idx on providers(created_at desc);
create index if not exists leads_provider_created_at_idx on leads(provider_id, created_at desc);
create index if not exists leads_type_created_at_idx on leads(type, created_at desc);
