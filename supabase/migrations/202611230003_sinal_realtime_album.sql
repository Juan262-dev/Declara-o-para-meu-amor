-- Sinal público SEM conteúdo das memórias para anunciar atualizações Realtime.
-- As fotos e os textos continuam sendo lidos SOMENTE pela Edge Function.
create table if not exists public.amor_sinal (
  id integer primary key default 1 check (id = 1),
  versao bigint not null default 0 check (versao >= 0),
  atualizado_em timestamptz not null default now()
);
alter table public.amor_sinal enable row level security;

revoke all on public.amor_sinal from public, anon, authenticated;
grant select on public.amor_sinal to anon;
grant select, insert, update on public.amor_sinal to service_role;

create policy "visitantes podem acompanhar versao publica"
  on public.amor_sinal
  for select
  to anon
  using (true);

insert into public.amor_sinal(id,versao)
values (1,0)
on conflict (id) do nothing;

-- Trigger invoker: executa com os privilégios de quem grava a lembrança.
-- Não é uma função remota de edição, apenas incrementa o número da versão.
create or replace function public.amor_anunciar_alteracao()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.amor_sinal
     set versao = versao + 1, atualizado_em = clock_timestamp()
   where id = 1;
  return null;
end;
$$;

revoke all on function public.amor_anunciar_alteracao() from public, anon, authenticated;
grant execute on function public.amor_anunciar_alteracao() to service_role;

create trigger amor_memorias_alteradas
  after insert or update or delete on public.amor_memorias
  for each row execute function public.amor_anunciar_alteracao();

create trigger amor_extras_alterados
  after insert or update or delete on public.amor_extras
  for each row execute function public.amor_anunciar_alteracao();

-- Publica apenas a versão, não fotos, relatos ou chaves do backend.
do $$
begin
  if not exists(
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'amor_sinal'
  ) then
    alter publication supabase_realtime add table public.amor_sinal;
  end if;
end;
$$;
