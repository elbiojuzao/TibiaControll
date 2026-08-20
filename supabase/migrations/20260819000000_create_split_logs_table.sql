-- ============================================================================
-- Tibia Party Manager — tabela de split_logs (splits salvos da Calculadora de
-- Split Loot)
-- ============================================================================
-- Pedido do usuário em 2026-08-19: "eu tenho hoje uma planilha que eu salvo
-- os splitloots... eu quero fazer ela ir pro banco de dados, assim estaremos
-- mais uma vez juntando as coisas no mesmo local". A página do Split Loot
-- ganhou 2 botões — "Salvar Split Boss" e "Salvar Split Hunt" — que gravam o
-- split calculado (log colado + membros + transferências) como um registro
-- aqui, marcado com a coluna `tipo`.
--
-- Confirmado com o usuário:
--   - Guarda o split COMPLETO (log bruto + detalhe por membro), não só o
--     valor agregado do dia — ele quer poder reprocessar/ajustar depois caso
--     um dia não seja salvo ou dê algum problema.
--   - Cada clique em "Salvar" cria uma LINHA NOVA (não soma nem sobrescreve o
--     dia) — pode ter múltiplos splits do mesmo tipo no mesmo dia.
--   - `data` é a data da SESSÃO extraída do log (não a data em que foi
--     salvo), com uma regra de corte: sessão que termina entre 00:00 e 00:59
--     conta pro dia anterior. Ver services/split/session-date.ts.
--
-- account_id/RLS seguem o mesmo padrão de drops/serviceiros/members (ver
-- migration 20260814000000_enable_rls_with_auth.sql).
-- ============================================================================

create table if not exists split_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  data date not null,
  tipo text not null check (tipo in ('hunt', 'boss')),
  log_bruto text not null,
  membros jsonb not null,
  transferencias jsonb not null,
  balance_total bigint not null,
  cota_por_membro bigint not null,
  cotacao_tc bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_split_logs_account_date on split_logs(account_id, data desc);

comment on column split_logs.log_bruto is 'Texto completo colado do Party Hunt Analyzer, preservado pra reprocessar/ajustar depois se precisar.';
comment on column split_logs.membros is 'Array de SplitLogMember (name, loot, supplies, balance, extraTc, extraGold, adjustedBalance).';
comment on column split_logs.transferencias is 'Array de SplitLogTransfer (from, to, amount, commandText) — os comandos transfer calculados.';

alter table split_logs enable row level security;

create policy "own_account_split_logs" on split_logs
  for all to authenticated
  using (account_id in (select id from accounts where user_id = auth.uid()))
  with check (account_id in (select id from accounts where user_id = auth.uid()));
