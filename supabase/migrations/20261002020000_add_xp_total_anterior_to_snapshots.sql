-- ============================================================================
-- member_xp_snapshots: total do dia anterior ao lado do total do dia
-- ============================================================================
-- Pedido do usuário (2026-10-02): cada linha deve ter a data, a XP total do dia anterior e a
-- XP total do dia — o ganho do dia é a diferença entre as duas (xp_ganho). Guardar o
-- "anterior" na própria linha deixa cada dia auditável sozinho, sem depender da linha vizinha.
-- ============================================================================

alter table member_xp_snapshots add column if not exists xp_total_anterior bigint;

comment on column member_xp_snapshots.xp_total_anterior is 'XP total acumulada no snapshot imediatamente anterior (dia anterior, ou o último dia coletado se o cron pulou algum). xp_ganho = xp_total - xp_total_anterior. NULL no 1º dia de coleta de um personagem sem histórico.';

-- Backfill do histórico: anterior = total da linha anterior; na 1ª linha do personagem (sem
-- linha anterior) deriva do próprio ganho do dia (total - ganho).
update member_xp_snapshots s
set xp_total_anterior = coalesce(p.prev_total, s.xp_total - s.xp_ganho)
from (
  select id, lag(xp_total) over (partition by member_id order by data) as prev_total
  from member_xp_snapshots
) p
where p.id = s.id
  and s.xp_total is not null;
