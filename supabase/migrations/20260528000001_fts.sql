alter table providers add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored;

create index if not exists providers_search_idx on providers using gin(search_vector);
