-- ============================================================================
-- Tibia Party Manager — tabela de party_events (eventos cadastrados
-- manualmente pelo usuário no Calendário/Histórico)
-- ============================================================================
-- Pedido do usuário em 2026-08-25: "na tela do calendario (historico) vamos
-- fazer o botao de adicionar novo evento que abre a modal e o usuario vai
-- digitar sobre o evento e cadastrar".
--
-- Confirmado com o usuário via AskUserQuestion antes de implementar:
--   - Evento pode ter início/fim (não só 1 dia).
--   - Compartilhado com a conta/PT (mesmo padrão de drops/splits/membros),
--     não é privado por login individual.
--   - Campos: título + descrição.
--   - Tipo do evento (refinamento no mesmo dia, antes da 1ª aplicação desta
--     migration — por isso a coluna já nasce aqui em vez de uma migration
--     separada): lista fixa fechada (Double XP/Rapid Respawn/Exaltation
--     Forge/Double Skill), pode marcar mais de 1 tipo por evento.
--
-- Não confundir com `tibia_events` (migration 20260817010000) — aquela é
-- dado UNIVERSAL do jogo (eventos oficiais da CipSoft, sem account_id,
-- recorrente por mês/dia todo ano); esta aqui é dado DA CONTA, com data
-- concreta (ano incluso), cadastrado à mão pelo usuário.
--
-- account_id/RLS seguem o mesmo padrão de split_logs/drops/serviceiros (ver
-- migration 20260814000000_enable_rls_with_auth.sql).
-- ============================================================================

create table if not exists party_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  title text not null,
  description text not null default '',
  start_date date not null,
  end_date date not null,
  categories text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint party_events_date_range check (end_date >= start_date),
  constraint party_events_categories_valid check (
    categories <@ array['double_xp', 'rapid_respawn', 'exaltation_forge', 'double_skill']
  )
);

create index if not exists idx_party_events_account_dates on party_events(account_id, start_date desc);

comment on column party_events.start_date is 'Data de início do evento (concreta, com ano) — igual a end_date quando o evento é de 1 dia só.';
comment on column party_events.end_date is 'Data de fim do evento (concreta, com ano, inclusive).';
comment on column party_events.categories is 'Tipo(s) do evento — lista fixa fechada (double_xp/rapid_respawn/exaltation_forge/double_skill), pode ter mais de 1 por evento.';

alter table party_events enable row level security;

create policy "own_account_party_events" on party_events
  for all to authenticated
  using (account_id in (select id from accounts where user_id = auth.uid()))
  with check (account_id in (select id from accounts where user_id = auth.uid()));
