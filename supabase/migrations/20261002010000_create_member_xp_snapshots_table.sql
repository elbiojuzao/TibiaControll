-- ============================================================================
-- Tibia Party Manager — snapshots diários de XP por personagem
-- ============================================================================
-- Substitui a leitura da planilha Google Sheets do usuário (aba "Xp Realizada", rotina
-- dele no Apps Script) por coleta automática nossa: um Vercel Cron (api/cron/xp-collect)
-- roda todo dia a partir das 6h30 BRT, lê a XP total (lifetime) do personagem nos
-- Highscores do TibiaData e grava aqui.
--
-- Identidade = member_id (FK estável), NÃO o nome — sobrevive a rename do personagem (ver
-- members.nomes_antigos, migration 20261002000000).
--
-- account_id/RLS seguem o mesmo padrão de split_logs/members. O cron escreve com a service
-- role key (ignora RLS); o app só LÊ, com a sessão do usuário.
-- ============================================================================

create table if not exists member_xp_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  character_name text not null,
  data date not null,
  xp_total bigint,
  xp_ganho bigint,
  created_at timestamptz not null default now(),
  unique (member_id, data)
);

create index if not exists idx_member_xp_snapshots_account_member
  on member_xp_snapshots(account_id, member_id, data desc);

comment on column member_xp_snapshots.character_name is 'Denormalizado: nome exibido naquele dia (histórico/debug). NÃO é a chave de identidade — essa é member_id.';
comment on column member_xp_snapshots.xp_total is 'XP total acumulada (lifetime) do Highscores naquele dia. NULL nas linhas importadas do histórico da planilha (só se sabe o ganho do dia, não o acumulado).';
comment on column member_xp_snapshots.xp_ganho is 'XP ganha naquele dia = xp_total(hoje) - xp_total do último snapshot anterior. NULL só no 1º dia de coleta por personagem (sem baseline). Se o cron pular um dia, o ganho do próximo dia agrega os dias pulados (mesmo comportamento da planilha).';

alter table member_xp_snapshots enable row level security;

create policy "own_account_member_xp_snapshots" on member_xp_snapshots
  for all to authenticated
  using (account_id in (select id from accounts where user_id = auth.uid()))
  with check (account_id in (select id from accounts where user_id = auth.uid()));
