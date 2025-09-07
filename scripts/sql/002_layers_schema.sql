-- Tabelas mínimas
create table if not exists public.unidades (
  id text primary key,
  nome text not null,
  uf text not null,
  regiao text not null,
  tipo text not null check (tipo in ('igreja','nucleo','celula')),
  pastor text,
  geom geography(point) not null
);

create index if not exists unidades_geom_gix on public.unidades using gist(geom);

create table if not exists public.regioes (
  id bigserial primary key,
  nome text unique not null,
  geom geography(polygon) not null
);
create index if not exists regioes_geom_gix on public.regioes using gist(geom);

create table if not exists public.ufs (
  uf text primary key,
  nome text not null,
  geom geography(polygon) not null
);
create index if not exists ufs_geom_gix on public.ufs using gist(geom);
