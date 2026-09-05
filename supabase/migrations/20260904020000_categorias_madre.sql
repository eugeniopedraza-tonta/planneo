-- Árbol de 8 madres + Otros. Renombra slugs existentes, actualiza nombres
-- e inserta las madres que faltan. No remapea el CSV de Gus: solo filas
-- ya persistidas. Las subcategorías se validan en la app.

-- 1. Renombrar slugs en sitio (los providers siguen el category_id).
update categories
set slug = 'foto-video', name = 'Foto y video'
where slug = 'fotografia';

update categories
set slug = 'lugares', name = 'Lugares y salones'
where slug = 'salones';

-- 2. Nombres de madres que conservan slug.
update categories set name = 'Belleza e imagen' where slug = 'belleza';
update categories set name = 'Música y entretenimiento' where slug = 'musica';
update categories set name = 'Banquete y bebidas' where slug = 'banquete';
update categories set name = 'Decoración y ambientación' where slug = 'decoracion';

-- 3. Madres nuevas (y reafirma nombres si el slug ya existiera).
insert into categories (name, slug) values
  ('Mobiliario y equipo', 'mobiliario'),
  ('Invitaciones y detalles', 'invitaciones'),
  ('Otros servicios', 'otros')
on conflict (slug) do update set name = excluded.name;

-- 4. Etiqueta opcional dentro de la madre. Sin CHECK: el mapa vive en constants.
alter table providers
  add column if not exists subcategory text;

create index if not exists providers_category_subcategory_idx
  on providers (category_id, subcategory);
