# Como integrar com Supabase no Next.js (resumo)

- Declare `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. [^3]
- Use clientes separados para Server Components/Route Handlers e Client Components. [^2][^3]
- Em Next.js App Router, crie utilitários `utils/supabase/server` e `utils/supabase/client` e leia no servidor quando possível, mantendo dados sensíveis no server. [^2][^3]
- Para dados geoespaciais, habilite PostGIS e crie índices GIST. [^4]

Recursos oficiais: Getting Started, Next.js quickstarts e user management app. [^1][^2][^3]
