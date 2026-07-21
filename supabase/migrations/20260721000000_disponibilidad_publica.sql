-- Fase Carrito, Sprint 7: el perfil público muestra el calendario del proveedor.
-- provider_availability es owner-only y su columna note es privada; esta vista
-- expone solo (provider_id, date, status) de proveedores públicos. Como vista
-- security definer (default), lee por encima de RLS pero con el WHERE fijo.

create view public_provider_availability as
  select provider_id, date, status
  from provider_availability
  where provider_is_public(provider_id);

grant select on public_provider_availability to anon, authenticated;
