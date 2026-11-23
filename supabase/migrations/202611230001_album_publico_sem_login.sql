-- Nossa História Infinita: app público para leitura e protegido por código para escrita.
-- Todas as operações passam pela Edge Function album-sync; o cliente nunca recebe secret key.
-- Aplique apenas em um projeto Supabase criado para este álbum.

create table if not exists public.amor_memorias (
  foto_indice integer primary key check (foto_indice between 0 and 39),
  src text not null check (char_length(src) between 1 and 1200),
  legenda text not null check (char_length(legenda) between 1 and 110),
  data date,
  relato text not null default '' check (char_length(relato) <= 1600),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.amor_extras (
  id integer primary key default 1 check (id = 1),
  bilhetes jsonb not null default '[]'::jsonb check (jsonb_typeof(bilhetes) = 'array'),
  musica jsonb not null default '{"titulo":"","url":""}'::jsonb check (jsonb_typeof(musica) = 'object'),
  sonhos jsonb not null default '[]'::jsonb check (jsonb_typeof(sonhos) = 'array'),
  atualizado_em timestamptz not null default now()
);

alter table public.amor_memorias enable row level security;
alter table public.amor_extras enable row level security;

-- Bloqueia tanto leitura quanto escrita direta via API REST pública;
-- SOMENTE a Edge Function, com chave de servidor, gerencia estes dados.
revoke all on public.amor_memorias from public, anon, authenticated;
revoke all on public.amor_extras from public, anon, authenticated;
grant all on public.amor_memorias to service_role;
grant all on public.amor_extras to service_role;

-- As cinco fotografias e os textos abaixo já estavam publicados no site.
-- ON CONFLICT DO NOTHING: nunca substitui dados criados depois.
insert into public.amor_memorias(foto_indice, src, legenda, data, relato)
values
  (0, 'https://i.imgur.com/zKPMj1z.jpg', 'Nossa lembrança linda ✨', '2026-09-28', 'Um dia antes do aniversário do meu amor'),
  (1, 'https://i.imgur.com/X6tkfUY.jpg', 'Meu grudinho pra vida toda 👩‍❤️‍👨', '2026-09-30', 'um dia apos o pedido oficial de namoro'),
  (2, 'https://i.imgur.com/2KKbZUp.jpg', 'Te amo hoje e sempre ❤️', null, ''),
  (3, 'fotos/lembranca-04.webp', 'Nosso registro em filme ♡', null, ''),
  (4, 'fotos/lembranca-05.webp', 'Outro registro em filme ♡', null, '')
on conflict (foto_indice) do nothing;

insert into public.amor_extras(id, bilhetes, musica, sonhos)
values (1,
  '["Eu te amo demais! ❤️","Te amo hoje e sempre ❤️","Cada segundo ao teu lado é um presente.","Meu grudinho pra vida toda 👩‍❤️‍👨","E a nossa história continua sendo escrita… ✿"]'::jsonb,
  '{"titulo":"","url":""}'::jsonb,
  '[]'::jsonb)
on conflict (id) do nothing;

-- Storage público porque o site não terá login: qualquer pessoa com a URL pode ver imagens.
-- Os visitantes NÃO recebem permissão para enviar, substituir ou apagar fotos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'amor-fotos-publicas', 'amor-fotos-publicas', true, 5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- NÃO criar políticas em storage.objects para anon/authenticated; os uploads
-- serão autenticados pelo código de edição verificado na Edge Function.
