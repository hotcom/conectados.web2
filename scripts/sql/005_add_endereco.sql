-- Campo opcional de endereço textual exibido no popup
alter table if exists public.unidades
  add column if not exists endereco text;
