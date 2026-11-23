-- Contenção de abuso para edição pública SEM login e SEM código.
-- As tabelas continuam inacessíveis diretamente para anon/authenticated.
-- A Edge Function usa esta função atomicamente antes de gravar.
create table if not exists public.amor_limites_edicao (
  tipo text primary key check (tipo in ('escrita', 'foto_hora', 'foto_dia')),
  inicio timestamptz not null default now(),
  quantidade integer not null default 0 check (quantidade >= 0)
);

alter table public.amor_limites_edicao enable row level security;
revoke all on public.amor_limites_edicao from public, anon, authenticated;
grant select, insert, update on public.amor_limites_edicao to service_role;

create or replace function public.amor_reservar_edicao(p_tipo text)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  limite integer;
  periodo interval;
  reservado boolean := false;
begin
  if p_tipo = 'escrita' then
    limite := 30; periodo := interval '15 minutes';
  elsif p_tipo = 'foto_hora' then
    limite := 4; periodo := interval '1 hour';
  elsif p_tipo = 'foto_dia' then
    limite := 8; periodo := interval '24 hours';
  else
    return false;
  end if;

  insert into public.amor_limites_edicao as contador (tipo, inicio, quantidade)
  values (p_tipo, clock_timestamp(), 1)
  on conflict (tipo) do update set
    inicio = case when clock_timestamp() >= contador.inicio + periodo
        then clock_timestamp() else contador.inicio end,
    quantidade = case when clock_timestamp() >= contador.inicio + periodo
        then 1 else contador.quantidade + 1 end
  where clock_timestamp() >= contador.inicio + periodo
     or contador.quantidade < limite
  returning true into reservado;

  return coalesce(reservado, false);
end;
$$;

revoke all on function public.amor_reservar_edicao(text) from public, anon, authenticated;
grant execute on function public.amor_reservar_edicao(text) to service_role;
