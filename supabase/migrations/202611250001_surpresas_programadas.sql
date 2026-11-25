-- Mensagens programadas para aparecer em datas escolhidas.
-- Não modifica bilhetes, sonhos nem música já salvos.
alter table public.amor_extras
  add column if not exists surpresas jsonb not null default '[]'::jsonb;

alter table public.amor_extras
  add constraint amor_extras_surpresas_lista_check
  check (jsonb_typeof(surpresas) = 'array' and jsonb_array_length(surpresas) <= 20);
-- A RLS já está ativa: visitantes não leem nem escrevem a tabela diretamente.
-- A função album-sync faz validação do conteúdo antes de salvar.
