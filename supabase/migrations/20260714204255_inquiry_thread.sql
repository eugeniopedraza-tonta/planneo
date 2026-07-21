-- Cotización en plataforma: hilo de mensajes por consulta y acceso del cliente
-- vía token (los clientes aún no tienen cuenta; el token es su capacidad de acceso).

-- Token de acceso del cliente a su consulta (/consulta/{token})
alter table inquiries
  add column access_token uuid not null default gen_random_uuid();

create unique index inquiries_access_token_idx on inquiries(access_token);

-- Hilo de mensajes (respuestas del proveedor con cotización opcional y réplicas del cliente)
create table inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references inquiries(id) on delete cascade,
  sender text not null check (sender in ('provider', 'client')),
  body text not null,
  quote_amount numeric,
  created_at timestamptz default now()
);

create index inquiry_messages_inquiry_idx on inquiry_messages(inquiry_id, created_at);

alter table inquiry_messages enable row level security;

grant select, insert on inquiry_messages to authenticated;

-- El proveedor dueño lee el hilo de sus consultas y escribe como 'provider'.
-- El cliente accede solo server-side vía token (service role), sin policies anon.
create policy "inquiry_messages_owner_read" on inquiry_messages
  for select to authenticated
  using (exists (
    select 1 from inquiries i
    where i.id = inquiry_id and owns_provider(i.provider_id)
  ));

create policy "inquiry_messages_owner_insert" on inquiry_messages
  for insert to authenticated
  with check (
    sender = 'provider'
    and exists (
      select 1 from inquiries i
      where i.id = inquiry_id and owns_provider(i.provider_id)
    )
  );

create policy "inquiry_messages_admin_all" on inquiry_messages
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
