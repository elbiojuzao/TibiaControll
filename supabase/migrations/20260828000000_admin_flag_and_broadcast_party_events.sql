-- ============================================================================
-- Flag de admin em accounts + party_events vira mural (só admin cria, todo
-- mundo autenticado lê)
-- ============================================================================
-- Pedido do usuário em 2026-08-28: "o adicionar evento tem que ser em
-- configurações... e só pode aparecer para contas Admin (contas admin devem
-- ter uma flag no banco de dados como admin)". Confirmado via AskUserQuestion
-- que, quando um admin cadastra um evento, TODAS as contas devem ver
-- ("Todas as contas (Recomendado)") — muda o modelo de party_events de
-- "privado por conta" (migration 20260825000000) pra "mural: leitura aberta,
-- escrita só admin".
-- ============================================================================

alter table accounts add column if not exists is_admin boolean not null default false;

comment on column accounts.is_admin is 'Conta com permissão de administrador do app — não é por pessoa, é por conta/party (mesmo modelo de login compartilhado, ver migração 20260814000000). Hoje só controla quem cadastra em party_events; pode crescer pra outras funções admin depois.';

-- party_events deixa de ser dado privado por account_id e vira mural: qualquer conta
-- autenticada LÊ todos os eventos, só conta admin CRIA. Substitui a policy
-- "own_account_party_events" (for all, migration 20260825000000) por duas policies
-- separadas (select aberto vs insert restrito).
drop policy if exists "own_account_party_events" on party_events;

create policy "party_events_select_all" on party_events
  for select to authenticated
  using (true);

create policy "party_events_insert_admin_only" on party_events
  for insert to authenticated
  with check (
    account_id in (select id from accounts where user_id = auth.uid() and is_admin = true)
  );

-- ============================================================================
-- PASSO MANUAL depois de rodar essa migration: marcar sua conta como admin
-- (troque o e-mail abaixo se não for esse):
--
-- update accounts set is_admin = true
--   where user_id = (select id from auth.users where email = 'elbiojuzao@gmail.com');
--
-- Sem esse UPDATE, "Adicionar Eventos" fica escondido em Configurações pra
-- todo mundo (inclusive você) — a seção só aparece quando accounts.is_admin
-- da conta logada é true.
-- ============================================================================
