-- Habilitar PostGIS no Supabase (Dashboard > Database > Extensions) [^4]
-- Alternativamente via SQL:
create extension if not exists postgis;
create extension if not exists postgis_topology;

-- Schemas e permissões conforme sua política de segurança.
