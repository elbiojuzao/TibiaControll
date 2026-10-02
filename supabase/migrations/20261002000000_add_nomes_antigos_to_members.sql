-- ============================================================================
-- Histórico de nomes do personagem (rename no jogo) em members
-- ============================================================================
-- Pedido do usuário em 2026-10-01/02: uma conta tem N personagens e um personagem pode
-- ser renomeado no Tibia — precisa guardar o nome atual, os nomes antigos e a conta de
-- origem (account_id, que já existe) pra não perder o vínculo com o histórico (XP etc.)
-- quando alguém trocar de nome. Tabelas que "seguem" um personagem ao longo do tempo (ex:
-- member_xp_snapshots) passam a referenciar members.id, não o nome.
-- ============================================================================

alter table members add column if not exists nomes_antigos text[] not null default '{}';

comment on column members.nomes_antigos is 'Histórico de nomes anteriores do personagem (renomeado no jogo) — preenchido automaticamente quando character_name muda via HttpMemberRepository.update(), nunca editado manualmente.';
