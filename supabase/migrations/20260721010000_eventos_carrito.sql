-- Fase Carrito, Sprint 8: el carrito se envía como un Evento que agrupa
-- una cotización (inquiry) por proveedor. Ver PLAN.md §6.2.

-- 1. events
create table events (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  event_type text check (event_type in ('bodas', 'xv', 'corporativo', 'graduacion')),
  event_date date not null,
  guest_count int,
  event_location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger events_updated_at
  before update on events
  for each row execute function update_updated_at();

create index events_client_idx on events(client_user_id, created_at desc);

-- 2. inquiries ← evento y paquete de interés
alter table inquiries
  add column event_id uuid references events(id) on delete set null,
  add column package_id uuid references service_packages(id) on delete set null;

create index inquiries_event_idx on inquiries(event_id) where event_id is not null;

-- 3. RLS: el cliente dueño lee/crea sus eventos. El proveedor NO lee events —
--    lo que necesita saber viaja en la inquiry. Admin todo.
alter table events enable row level security;

grant select, insert on events to authenticated;

create policy "events_owner_read" on events
  for select to authenticated
  using (client_user_id = (select auth.uid()));

create policy "events_owner_insert" on events
  for insert to authenticated
  with check (client_user_id = (select auth.uid()));

create policy "events_admin_all" on events
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4. Envío atómico del carrito: evento + N inquiries en UNA transacción.
--    SECURITY INVOKER: corre como el cliente autenticado, así que toda la
--    autorización sigue siendo RLS (insert de events e inquiries pasan por
--    sus policies). La disponibilidad se consulta vía la vista pública.
create function submit_event_cart(
  p_client_name text,
  p_client_phone text,
  p_event_name text,
  p_event_type text,
  p_event_date date,
  p_guest_count int,
  p_event_location text,
  p_message text,
  p_package_ids uuid[]
) returns uuid
language plpgsql
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text := coalesce(auth.jwt() ->> 'email', '');
  v_event_id uuid;
  v_pkg record;
  v_seen_providers uuid[] := '{}';
begin
  if v_uid is null then
    raise exception 'auth_required';
  end if;
  if p_package_ids is null or array_length(p_package_ids, 1) is null then
    raise exception 'empty_cart';
  end if;
  if p_event_date < current_date then
    raise exception 'past_date';
  end if;

  insert into events (client_user_id, name, event_type, event_date, guest_count, event_location)
  values (v_uid, nullif(trim(p_event_name), ''), nullif(p_event_type, ''),
          p_event_date, p_guest_count, nullif(trim(p_event_location), ''))
  returning id into v_event_id;

  for v_pkg in
    select sp.id as package_id, sp.name as package_name,
           p.id as provider_id, p.name as provider_name
    from unnest(p_package_ids) as wanted(id)
    join service_packages sp on sp.id = wanted.id
    join providers p on p.id = sp.provider_id
  loop
    -- Regla de disponibilidad: solo un día 'booked' bloquea (DISEÑO.md).
    if exists (
      select 1 from public_provider_availability a
      where a.provider_id = v_pkg.provider_id
        and a.date = p_event_date
        and a.status = 'booked'
    ) then
      raise exception 'provider_booked:%', v_pkg.provider_name;
    end if;

    -- Un proveedor puede aportar varios paquetes: una inquiry por paquete
    -- mantiene el hilo de cotización por servicio solicitado.
    insert into inquiries (
      provider_id, client_user_id, event_id, package_id,
      name, email, phone, event_type, event_date, event_location,
      guest_count, message
    ) values (
      v_pkg.provider_id, v_uid, v_event_id, v_pkg.package_id,
      p_client_name, nullif(v_email, ''), nullif(trim(p_client_phone), ''),
      nullif(p_event_type, ''), p_event_date, nullif(trim(p_event_location), ''),
      p_guest_count,
      coalesce(nullif(trim(p_message), ''), 'Solicitud de cotización desde el plan de evento.')
        || e'\n\nPaquete de interés: ' || v_pkg.package_name
    );

    v_seen_providers := v_seen_providers || v_pkg.provider_id;
  end loop;

  -- Si algún paquete del carrito ya no existe o su proveedor no es visible,
  -- el join lo omitió: mejor fallar todo que enviar un evento incompleto.
  if array_length(v_seen_providers, 1) <> array_length(p_package_ids, 1) then
    raise exception 'stale_cart';
  end if;

  return v_event_id;
end;
$$;
