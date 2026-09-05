-- Testimonios que Gus carga desde admin al perfil público.
-- Sin estrellas: un jsonb de citas, no un sistema de reseñas.
alter table providers
  add column if not exists testimonials jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'providers_testimonials_is_array'
      and conrelid = 'public.providers'::regclass
  ) then
    alter table providers
      add constraint providers_testimonials_is_array
      check (
        jsonb_typeof(testimonials) = 'array'
        and jsonb_array_length(testimonials) <= 6
      );
  end if;
end $$;
