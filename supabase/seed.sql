insert into categories (name, slug) values
  ('Fotografía / Video', 'fotografia'),
  ('Belleza / Maquillaje', 'belleza'),
  ('DJ / Música', 'musica'),
  ('Banquete / Catering', 'banquete'),
  ('Decoración', 'decoracion'),
  ('Salones de eventos', 'salones')
on conflict (slug) do nothing;
