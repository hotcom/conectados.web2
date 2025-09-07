# Conectando ao Supabase (quando quiser)

Este starter usa mocks em `/api` para rodar sem credenciais. Para plugar no Supabase:

1) Crie o projeto no Supabase e obtenha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. [^1][^3]

2) Crie as tabelas:
- `unidades` (id, nome, uf, regiao, tipo, pastor, geom POINT)
- `regioes` (id, nome, geom POLYGON)
- `ufs` (uf, nome, geom POLYGON)

Habilite a extensão PostGIS e crie índices espaciais (GIST) em `geom`. [^4]

3) No Next.js, você pode:
- Ler dados em Route Handlers (server) com `@supabase/supabase-js`.
- No cliente, prefira endpoints server-side para filtrar e retornar GeoJSON.

4) Troque o conteúdo de `app/api/unidades/route.ts` e `app/api/regioes/route.ts` para buscar do Supabase (SSR). Exemplo (resumo):

\`\`\`ts
// pseudo-código: crie um client server-side e consulte .from(...).select()
\`\`\`

Recursos:
- Getting Started e Quickstarts para Next.js com Supabase [^1][^3].
- PostGIS no Supabase para geo-consultas [^4].
