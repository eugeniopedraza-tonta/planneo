-- Datos de prueba LOCALES para verificación E2E (supabase start). Todo es ficticio:
-- nombres "Demo …", teléfonos 81 0000 XXXX y correos @example.test.
-- NUNCA correr contra producción.
--   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -f supabase/snippets/e2e_seed.sql

begin;

-- Limpia una corrida previa (solo filas creadas por este script).
delete from provider_availability where provider_id in (select id from providers where source_detail = 'e2e_seed');
delete from leads where provider_id in (select id from providers where source_detail = 'e2e_seed');
delete from claim_tokens where provider_id in (select id from providers where source_detail = 'e2e_seed');
delete from providers where source_detail = 'e2e_seed';

-- Unos cuantos proveedores por categoría (todas menos `invitaciones`, que queda vacía
-- para el estado vacío).
insert into providers (slug, name, category_id, status, phone, email, description, zona,
  event_types, price_range, published_at, source, source_detail, verification_status, subcategory)
select
  'demo-' || c.slug || '-' || g,
  'Demo ' || initcap(replace(c.slug, '-', ' ')) || ' ' || g,
  c.id,
  'published',
  '81 0000 ' || lpad((c_idx * 100 + g)::text, 4, '0'),
  'demo-' || c.slug || '-' || g || '@example.test',
  'Proveedor ficticio de prueba para ' || c.name || '. Servicio completo para tu evento.',
  (array['San Pedro Garza García','Guadalupe','Apodaca','Monterrey Centro'])[1 + (g % 4)],
  case when g % 2 = 0 then array['bodas','xv'] else array['corporativo','cumpleanos'] end,
  (array['$','$$','$$$'])[1 + (g % 3)],
  now() - (g || ' days')::interval,
  'admin', 'e2e_seed',
  case when g = 1 then 'verified' else 'none' end,
  null
from (select id, slug, name, row_number() over (order by slug) as c_idx from categories
      where slug not in ('invitaciones', 'foto-video')) c
cross join generate_series(1, 4) g;

-- `foto-video`: 130 publicados para el tope del catálogo (90) y la rama de >100 ocupados.
insert into providers (slug, name, category_id, status, phone, email, description, zona,
  event_types, price_range, published_at, created_at, source, source_detail, verification_status)
select
  'demo-foto-' || g,
  'Demo Foto ' || g,
  (select id from categories where slug = 'foto-video'),
  'published',
  '8100' || lpad((5000 + g)::text, 6, '0'),
  null,
  case when g % 10 = 0 then 'Fotografía de bodas con dron y estudio móvil.' else 'Fotografía y video para eventos.' end,
  (array['San Pedro Garza García','Guadalupe','Apodaca','Monterrey Centro'])[1 + (g % 4)],
  case when g % 2 = 0 then array['bodas','xv'] else array['corporativo','cumpleanos'] end,
  (array['$','$$','$$$'])[1 + (g % 3)],
  now() - (g || ' hours')::interval,
  now() - (g || ' hours')::interval,
  'admin', 'e2e_seed',
  case when g = 7 then 'verified' else 'none' end
from generate_series(1, 130) g;

-- Un borrador (no debe aparecer en público).
insert into providers (slug, name, category_id, status, phone, source, source_detail)
values ('demo-borrador', 'Demo Borrador', (select id from categories where slug = 'musica'),
  'draft', '8100009999', 'admin', 'e2e_seed');

-- 2026-12-12: 105 ocupados (rama >100), 5 libres confirmados, 3 tentativos en foto-video.
insert into provider_availability (provider_id, date, status)
select id, date '2026-12-12',
  case when n <= 105 then 'booked' when n <= 110 then 'available' else 'tentative' end
from (select id, row_number() over (order by slug) n from providers
      where slug like 'demo-foto-%') p
where n <= 113;

-- 2026-12-13: 3 ocupados (rama not.in).
insert into provider_availability (provider_id, date, status)
select id, date '2026-12-13', 'booked'
from providers where slug in ('demo-foto-1', 'demo-foto-2', 'demo-foto-3');

commit;
