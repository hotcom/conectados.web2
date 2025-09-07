-- Exemplo: Voronoi das unidades por região, armazenado em uma tabela.
-- Observação: ST_VoronoiPolygons funciona sobre geometries; convertemos de geography->geometry. [^4]

create table if not exists public.voronoi_regional (
  regiao text not null,
  cell_id bigserial primary key,
  geom geometry(polygon, 4326) not null
);

-- Recria as células por região (simplificado; ajuste para bordas/recortes regionais)
create or replace function public.recompute_voronoi()
returns void
language plpgsql
as $$
declare
  r record;
  g geometry;
begin
  truncate table public.voronoi_regional;
  for r in (select regiao from public.unidades group by regiao) loop
    -- coletar pontos da região
    with pts as (
      select st_collect(st_transform(geom::geometry,4326)) as g
      from public.unidades
      where regiao = r.regiao
    ),
    voro as (
      select st_voroNOiPolygons(g) as vc from pts
    ),
    cells as (
      select (st_dump(vc)).geom as geom
      from voro
    )
    insert into public.voronoi_regional(regiao, geom)
    select r.regiao, st_collectionextract(st_makevalid(geom),3) from cells;
  end loop;
end;
$$;

-- Dica: para recortar ao contorno da região: use ST_Intersection(cell, ST_Collect(regiao.geom::geometry))
