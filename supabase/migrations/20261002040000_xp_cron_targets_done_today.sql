-- ============================================================================
-- xp_cron_targets: informa quem já foi coletado hoje (idempotência do cron)
-- ============================================================================
-- Pedido do usuário (2026-10-02): se a coleta do dia já foi feita com sucesso, não repetir.
-- `done_today` = já existe snapshot de p_today pra esse member. Contas puladas por Highscore
-- desatualizado não gravam nada, então continuam "pendentes" e uma nova chamada tenta de novo.
-- ============================================================================

drop function if exists public.xp_cron_targets(text, date);

create function public.xp_cron_targets(p_secret text, p_today date)
returns table (
  member_id uuid,
  account_id uuid,
  character_name text,
  world text,
  prev_total bigint,
  done_today boolean
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
      order by s.data desc limit 1),
    exists (select 1 from public.member_xp_snapshots s
      where s.member_id = m.id and s.data = p_today and s.xp_total is not null)
  from public.members m
  join public.accounts a on a.id = m.account_id;
end;
$$;

revoke all on function public.xp_cron_targets(text, date) from public;
grant execute on function public.xp_cron_targets(text, date) to anon, authenticated;
