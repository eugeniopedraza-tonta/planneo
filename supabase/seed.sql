insert into categories (name, slug) values
  ('Lugares y salones', 'lugares'),
  ('Banquete y bebidas', 'banquete'),
  ('Música y entretenimiento', 'musica'),
  ('Foto y video', 'foto-video'),
  ('Decoración y ambientación', 'decoracion'),
  ('Mobiliario y equipo', 'mobiliario'),
  ('Belleza e imagen', 'belleza'),
  ('Invitaciones y detalles', 'invitaciones'),
  ('Otros servicios', 'otros')
on conflict (slug) do update set name = excluded.name;
