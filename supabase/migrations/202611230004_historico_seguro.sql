-- Histórico privado de revisões do álbum. O álbum continua SEM login para visitantes.
-- Recuperação de uma versão exige acesso administrativo ao projeto Supabase:
-- não conceder leitura/alteração direta ao público nem criar RPC pública de restauração.
create table if not exists public.amor_historico (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('memoria','extras')),
  registro_id integer not null,
  operacao text not null check (operacao in ('base','antes_editar','antes_excluir')),
  conteudo jsonb not null,
  registrado_em timestamptz not null default now()
);
create index if not exists idx_amor_historico_recente
  on public.amor_historico (id desc);
alter table public.amor_historico enable row level security;
revoke all on public.amor_historico from public, anon, authenticated;
grant select, insert, delete on public.amor_historico to service_role;
grant usage, select on sequence public.amor_historico_id_seq to service_role;

-- Guarda valores antigos antes de cada edição ou exclusão.
create or replace function public.amor_guardar_historico()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.amor_historico (tipo, registro_id, operacao, conteudo)
  values (
    case when TG_TABLE_NAME = 'amor_memorias' then 'memoria' else 'extras' end,
    case when TG_TABLE_NAME = 'amor_memorias' then OLD.foto_indice else OLD.id end,
    case when TG_OP = 'DELETE' then 'antes_excluir' else 'antes_editar' end,
    to_jsonb(OLD)
  );

  -- Limita armazenamento histórico a 200 versões para conter custos.
  delete from public.amor_historico
  where id in (select id from public.amor_historico order by id desc offset 200);
  return null;
end;
$$;

revoke all on function public.amor_guardar_historico() from public, anon, authenticated;
grant execute on function public.amor_guardar_historico() to service_role;

create trigger amor_memorias_historico
  after update or delete on public.amor_memorias
  for each row execute function public.amor_guardar_historico();
create trigger amor_extras_historico
  after update or delete on public.amor_extras
  for each row execute function public.amor_guardar_historico();

-- Registra a versão inicial das cinco fotos e das surpresas existentes.
insert into public.amor_historico(tipo,registro_id,operacao,conteudo)
select 'memoria', foto_indice, 'base', to_jsonb(m)
from public.amor_memorias m
order by foto_indice;
insert into public.amor_historico(tipo,registro_id,operacao,conteudo)
select 'extras', id, 'base', to_jsonb(e)
from public.amor_extras e;
