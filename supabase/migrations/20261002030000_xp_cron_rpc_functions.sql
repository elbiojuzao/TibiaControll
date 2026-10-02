-- ============================================================================
-- Funções RPC do cron de XP (api/cron/xp-collect) — alternativa à service role key
-- ============================================================================
-- O cron precisa ler members/accounts de TODAS as contas e gravar em member_xp_snapshots sem
-- ser um usuário logado. Em vez de dar à Vercel a service role key (acesso total ao banco),
-- expõe duas funções SECURITY DEFINER que só funcionam com o segredo do cron (CRON_SECRET):
-- o que vazar dali é só "listar personagens + gravar snapshots de XP", nada além.
--
-- O segredo NÃO fica neste arquivo: só o SHA-256 dele, em private.cron_secrets (schema não
-- exposto pela API), inserido à parte com:
--   insert into private.cron_secrets (name, secret_hash)
--   values ('xp_collect', encode(extensions.digest('<CRON_SECRET>', 'sha256'), 'hex'));
-- ============================================================================

create schema if not exists private;

create table if not exists private.cron_secrets (
  name text primary key,
  secret_hash text not null
);

alter table private.cron_secrets enable row level security;
revoke all on schema private from anon, authenticated;
revoke all on private.cron_secrets from anon, authenticated;

create or replace function private.check_cron_secret(p_name text, p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.cron_secrets
    where name = p_name
      and secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
  );
$$;

-- Personagens a coletar + último total conhecido ANTES de p_today (pra calcular o ganho).
create or replace function public.xp_cron_targets(p_secret text, p_today date)
returns table (
  member_id uuid,
  account_id uuid,
  character_name text,
  world text,
  prev_total bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.check_cron_secret('xp_collect', p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  return query
  select m.id, m.account_id, m.character_name, a.world,
    (select s.xp_total from public.member_xp_snapshots s
      where s.member_id = m.id and s.data < p_today and s.xp_total is not null
      order by s.data desc limit 1)
  from public.members m
  join public.accounts a on a.id = m.account_id;
end;
$$;

-- Grava (upsert por member_id+data) os snapshots calculados pelo cron. account_id e
-- character_name vêm de members, não do payload — o chamador só escolhe o member_id.
create or replace function public.xp_cron_save(p_secret text, p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved integer;
begin
  if not private.check_cron_secret('xp_collect', p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  insert into public.member_xp_snapshots
    (account_id, member_id, character_name, data, xp_total, xp_total_anterior, xp_ganho)
  select m.account_id, m.id, m.character_name, r.data, r.xp_total, r.xp_total_anterior, r.xp_ganho
  from jsonb_to_recordset(p_rows) as r(
    member_id uuid, data date, xp_total bigint, xp_total_anterior bigint, xp_ganho bigint
  )
  join public.members m on m.id = r.member_id
  on conflict (member_id, data) do update set
    character_name = excluded.character_name,
    xp_total = excluded.xp_total,
    xp_total_anterior = excluded.xp_total_anterior,
    xp_ganho = excluded.xp_ganho;

  get diagnostics saved = row_count;
  return saved;
end;
$$;

revoke all on function public.xp_cron_targets(text, date) from public;
revoke all on function public.xp_cron_save(text, jsonb) from public;
grant execute on function public.xp_cron_targets(text, date) to anon, authenticated;
grant execute on function public.xp_cron_save(text, jsonb) to anon, authenticated;
