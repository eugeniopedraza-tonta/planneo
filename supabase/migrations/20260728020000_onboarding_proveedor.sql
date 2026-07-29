-- Onboarding de proveedores: ciclo de vida, reclamación atómica y progreso.
--
-- Cambio de semántica importante: hasta ahora 'claimed' era un estado PÚBLICO
-- (aparecía en catálogo y pintaba el badge "Verificado"), lo que mezclaba tres
-- conceptos en una sola columna. A partir de aquí:
--   * el ciclo de vida vive en providers.status
--   * la propiedad vive en providers.claimed_by (ya existía)
--   * la reputación vive en providers.verification_status
-- Por eso 'claimed' desaparece como estado y sus filas pasan a 'published'.

-- ---------------------------------------------------------------------------
-- 1. Columnas nuevas de providers
-- ---------------------------------------------------------------------------
alter table providers
  add column if not exists verification_status text not null default 'none',
  add column if not exists published_at timestamptz,
  add column if not exists paused_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists source text,
  add column if not exists source_detail text,
  add column if not exists phone_confirmed_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Migración de datos + nuevo ciclo de vida
-- ---------------------------------------------------------------------------
alter table providers drop constraint if exists providers_status_check;

-- Los perfiles 'claimed' se emitieron con un token que Planneo entregó a mano,
-- así que conservan el badge: quedan publicados y verificados. Sin esto, el
-- catálogo perdería visualmente a todos los proveedores ya reclamados.
update providers
   set verification_status = 'verified'
 where status = 'claimed';

update providers set status = 'published' where status = 'claimed';
update providers set status = 'pending_review' where status = 'pending';

update providers set published_at = coalesce(published_at, created_at, now())
 where status = 'published';

alter table providers
  add constraint providers_status_check
  check (status in ('draft', 'pending_review', 'published', 'paused', 'rejected'));

alter table providers
  add constraint providers_verification_status_check
  check (verification_status in ('none', 'contact_confirmed', 'reviewed', 'verified'));

-- Badge público. Se expone como columna para poder ordenar y filtrar por ella
-- sin revelar claimed_by (un uuid de auth.users) en las consultas públicas.
alter table providers
  add column if not exists is_verified boolean
  generated always as (verification_status = 'verified') stored;

-- ---------------------------------------------------------------------------
-- 3. Solo los perfiles publicados son públicos
-- ---------------------------------------------------------------------------
-- Consecuencia buscada: un perfil 'paused' desaparece de catálogo, búsqueda y
-- sitemap sin que se borre ningún dato, y un perfil reclamado sigue privado
-- mientras el proveedor lo completa.
drop policy if exists "providers_public_read" on providers;
create policy "providers_public_read" on providers
  for select to anon, authenticated using (status = 'published');

-- provider_is_public() es el predicado que gobierna la visibilidad de paquetes,
-- media, venue_details, menús de banquete y la vista public_provider_availability
-- (7 policies). Se actualiza aquí o seguiría nombrando un estado que ya no existe.
create or replace function public.provider_is_public(pid uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from providers p
    where p.id = pid and p.status = 'published'
  );
$$;

-- Un usuario = un perfil. getOwnedProvider, (provider)/layout y panel/page usan
-- .maybeSingle() sobre claimed_by: con dos filas el panel entero fallaría en
-- silencio. El índice que existía no era único.
create unique index if not exists providers_claimed_by_unique
  on providers(claimed_by) where claimed_by is not null;

-- ---------------------------------------------------------------------------
-- 4. Guardia de columnas protegidas
-- ---------------------------------------------------------------------------
-- providers_owner_update permite al dueño actualizar su fila completa, así que
-- hoy podría auto-publicarse o cambiarse el slug con una llamada directa a
-- PostgREST. RLS no distingue columnas; el trigger sí.
create or replace function public.is_privileged_writer()
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_claims text := current_setting('request.jwt.claims', true);
  v_json jsonb;
begin
  -- Transacción marcada por una función de servidor de confianza.
  if coalesce(current_setting('planneo.bypass_provider_guard', true), '') = 'on' then
    return true;
  end if;
  -- Sin JWT: SQL directo (migraciones, psql, jobs). No hay usuario que limitar.
  if v_claims is null or v_claims = '' then
    return true;
  end if;
  v_json := v_claims::jsonb;
  return coalesce(v_json ->> 'role', '') = 'service_role'
      or coalesce(v_json -> 'app_metadata' ->> 'role', '') = 'admin';
end;
$$;

create or replace function public.providers_guard_protected_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  -- Se comparan valores, no columnas enviadas: los editores del panel
  -- (updateProfile, sync de photos) reescriben la fila entera con los mismos
  -- valores en estas columnas y deben seguir pasando.
  if new.status is distinct from old.status
     or new.slug is distinct from old.slug
     or new.claimed_by is distinct from old.claimed_by
     or new.verification_status is distinct from old.verification_status
     or new.published_at is distinct from old.published_at
     or new.paused_at is distinct from old.paused_at
     or new.phone_confirmed_at is distinct from old.phone_confirmed_at then
    raise exception 'protected_column_update'
      using hint = 'status, slug, claimed_by y verification_status solo cambian desde acciones de servidor';
  end if;

  return new;
end;
$$;

drop trigger if exists providers_guard_protected on providers;
create trigger providers_guard_protected
  before update on providers
  for each row execute function public.providers_guard_protected_columns();

-- ---------------------------------------------------------------------------
-- 5. Progreso de activación
-- ---------------------------------------------------------------------------
create table if not exists provider_onboarding_progress (
  provider_id uuid primary key references providers(id) on delete cascade,
  completed_tasks jsonb not null default '{}'::jsonb,
  last_task text,
  last_seen_at timestamptz,
  terms_version text,
  terms_accepted_at timestamptz,
  privacy_version text,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table provider_onboarding_progress enable row level security;

create trigger provider_onboarding_progress_updated_at
  before update on provider_onboarding_progress
  for each row execute function update_updated_at();

grant select, insert, update on provider_onboarding_progress to authenticated;

create policy "onboarding_progress_owner_all" on provider_onboarding_progress
  for all to authenticated
  using (owns_provider(provider_id))
  with check (owns_provider(provider_id));

create policy "onboarding_progress_admin_all" on provider_onboarding_progress
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------------
-- 6. Analítica de onboarding (servidor, sin PII)
-- ---------------------------------------------------------------------------
create table if not exists provider_onboarding_events (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table provider_onboarding_events enable row level security;

create index if not exists provider_onboarding_events_name_idx
  on provider_onboarding_events(event_name, created_at desc);

-- Se escriben solo con service client; los admins pueden leerlos.
grant select on provider_onboarding_events to authenticated;

create policy "onboarding_events_admin_read" on provider_onboarding_events
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------------
-- 7. Intenciones de registro (borrador diferido)
-- ---------------------------------------------------------------------------
-- Un registro abandonado antes de verificar el código no debe dejar un provider
-- huérfano ni un duplicado en el catálogo: los datos esperan aquí y el perfil
-- se crea al verificar el OTP. Sin grants: solo service client.
create table if not exists provider_registration_intents (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  business_name text not null,
  category_id uuid references categories(id),
  zona text,
  source text,
  source_detail text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  consumed_at timestamptz
);

alter table provider_registration_intents enable row level security;

create index if not exists provider_registration_intents_email_idx
  on provider_registration_intents(email, created_at desc);

-- ---------------------------------------------------------------------------
-- 8. Tokens de reclamación revocables + redención atómica
-- ---------------------------------------------------------------------------
alter table claim_tokens
  add column if not exists revoked_at timestamptz,
  add column if not exists reported_at timestamptz,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists created_at timestamptz not null default now();

-- Reemplaza la secuencia de tres statements sueltos que había en la Server
-- Action: validar, asignar propiedad y quemar el token ocurren en una sola
-- transacción, con FOR UPDATE para que dos redenciones simultáneas no ganen
-- las dos.
create or replace function public.redeem_claim_token(
  p_token uuid,
  p_user_id uuid,
  p_phone text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token claim_tokens%rowtype;
  v_provider_id uuid;
  v_phone text := nullif(trim(coalesce(p_phone, '')), '');
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'auth_required');
  end if;

  select * into v_token from claim_tokens where token = p_token for update;

  if not found then return jsonb_build_object('ok', false, 'error', 'invalid'); end if;
  if v_token.revoked_at is not null then return jsonb_build_object('ok', false, 'error', 'invalid'); end if;
  if v_token.used_at is not null then return jsonb_build_object('ok', false, 'error', 'used'); end if;
  if v_token.expires_at < now() then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
  if v_token.provider_id is null then return jsonb_build_object('ok', false, 'error', 'invalid'); end if;

  select id into v_provider_id
    from providers
   where id = v_token.provider_id
     and (claimed_by is null or claimed_by = p_user_id)
   for update;

  if not found then return jsonb_build_object('ok', false, 'error', 'already_claimed'); end if;

  perform set_config('planneo.bypass_provider_guard', 'on', true);

  update providers
     set claimed_by = p_user_id,
         -- Un perfil que Planneo ya tenía publicado sigue publicado; uno en
         -- borrador se queda en borrador hasta que se complete la activación.
         status = case when status = 'published' then 'published' else 'draft' end,
         verification_status = case
           when verification_status = 'none' then 'contact_confirmed'
           else verification_status
         end,
         phone = coalesce(v_phone, phone),
         phone_confirmed_at = case when v_phone is not null then now() else phone_confirmed_at end,
         source = coalesce(source, 'claim'),
         source_detail = coalesce(source_detail, v_token.id::text)
   where id = v_provider_id;

  update claim_tokens set used_at = now() where id = v_token.id;

  -- Los demás tokens vivos del mismo proveedor dejan de servir.
  update claim_tokens
     set revoked_at = now()
   where provider_id = v_provider_id
     and id <> v_token.id
     and used_at is null
     and revoked_at is null;

  insert into provider_onboarding_progress (provider_id, last_task, last_seen_at)
  values (v_provider_id, 'basics', now())
  on conflict (provider_id) do update set last_seen_at = now();

  return jsonb_build_object('ok', true, 'provider_id', v_provider_id);
end;
$$;

-- Postgres concede EXECUTE a PUBLIC por defecto, así que revocar solo a anon y
-- authenticated no quita nada: hay que revocar a PUBLIC. Sin esto, cualquier
-- usuario con sesión podría invocar esta función SECURITY DEFINER pasando el
-- p_user_id que quisiera.
revoke execute on function public.redeem_claim_token(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.redeem_claim_token(uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- 9. Rate limiting (OTP, reclamación, registro)
-- ---------------------------------------------------------------------------
create table if not exists rate_limit_hits (
  id bigserial primary key,
  key text not null,
  hit_at timestamptz not null default now()
);

alter table rate_limit_hits enable row level security;

create index if not exists rate_limit_hits_key_idx on rate_limit_hits(key, hit_at desc);

create or replace function public.check_rate_limit(
  p_key text,
  p_max int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- Barrido probabilístico para no pagar un DELETE en cada llamada.
  if random() < 0.01 then
    delete from rate_limit_hits where hit_at < now() - interval '1 day';
  end if;

  select count(*) into v_count
    from rate_limit_hits
   where key = p_key
     and hit_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max then
    return false;
  end if;

  insert into rate_limit_hits (key) values (p_key);
  return true;
end;
$$;

-- Igual que arriba: hay que revocar a PUBLIC. Si no, cualquiera podría agotar
-- el cupo de códigos del correo de otra persona para dejarla fuera.
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;

-- ---------------------------------------------------------------------------
-- 10. Tipos de evento ampliados
-- ---------------------------------------------------------------------------
-- El onboarding pide elegir entre 7 tipos de evento. providers.event_types es
-- text[] sin check, pero events.event_type sí estaba limitado a los 4 viejos y
-- reventaría al definir un evento de cumpleaños desde el carrito.
alter table events drop constraint if exists events_event_type_check;
alter table events
  add constraint events_event_type_check
  check (event_type in ('bodas', 'xv', 'corporativo', 'graduacion',
                        'cumpleanos', 'bautizo', 'otro'));
