-- Função RPC para inserir unidade com geography(Point)
-- Execute após criar as tabelas.
create or replace function public.insert_unidade(
  p_id text,
  p_nome text,
  p_uf text,
  p_regiao text,
  p_tipo text,
  p_pastor text,
  p_endereco text,
  p_lng double precision,
  p_lat double precision
) returns public.unidades
language sql
security definer
set search_path = public
as $$
  insert into public.unidades (id, nome, uf, regiao, tipo, pastor, endereco, geom)
  values (
    p_id,
    p_nome,
    upper(p_uf),
    upper(p_regiao),
    lower(p_tipo),
    nullif(p_pastor, ''),
    nullif(p_endereco, ''),
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  )
  returning *;
$$;
