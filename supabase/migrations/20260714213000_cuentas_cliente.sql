-- Cuentas de cliente (organizadores de eventos, rol 'client' en app_metadata).
-- Las consultas creadas con sesión iniciada quedan ligadas a la cuenta, para
-- que el cliente vea su historial en /mis-consultas. El acceso por token
-- (/consulta/{token}) sigue funcionando para clientes sin cuenta.

alter table inquiries
  add column client_user_id uuid references auth.users(id) on delete set null;

create index inquiries_client_user_idx on inquiries(client_user_id)
  where client_user_id is not null;

-- El cliente autenticado lee sus propias consultas...
create policy "inquiries_client_read" on inquiries
  for select to authenticated
  using (client_user_id = (select auth.uid()));

-- ...y el hilo de mensajes de esas consultas.
create policy "inquiry_messages_client_read" on inquiry_messages
  for select to authenticated
  using (exists (
    select 1 from inquiries i
    where i.id = inquiry_id and i.client_user_id = (select auth.uid())
  ));
