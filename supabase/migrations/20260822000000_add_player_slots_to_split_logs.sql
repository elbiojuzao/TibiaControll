-- ============================================================================
-- Tibia Party Manager — colunas rígidas de Dano/Cura por player em split_logs
-- ============================================================================
-- Pedido do usuário em 2026-08-22: depois de ver a tela do Histórico de Splits
-- explodindo 1 linha por MEMBRO de cada split, pediu pra voltar a 1 linha por
-- SPLIT (dia 22, por exemplo, tem 2 linhas — 1 de Boss, 1 de Hunt — não 1
-- linha por jogador). E propôs: "talvez seja melhor nos separar os danos e
-- cura direto no banco assim não vai ter que splitar toda vez... o ideal é
-- colocar até 8 colunas de player nunca vai ter mais que isso. ai teremos a
-- coluna com o split inteiro e tambem teremos as colunas rigidas de cada
-- player".
--
-- Resultado: `membros` (jsonb, split_logs já existente) continua intacto —
-- "a coluna com o split inteiro" — e ganhou uma cópia denormalizada do
-- name/damage/healing de até 8 jogadores em colunas fixas, pra Histórico de
-- Splits ler direto sem precisar desmontar o jsonb toda vez.
--
-- Preenchidas por HttpSplitLogRepository.create() a partir de dto.members
-- (os primeiros 8), redundante de propósito com membros[].damage/.healing —
-- mesma informação, 2 formatos. Splits salvos ANTES dessa migration ficam com
-- todas essas colunas NULL (nenhum backfill automático).
-- ============================================================================

alter table split_logs
  add column player1_nome text,
  add column player1_dano bigint,
  add column player1_cura bigint,
  add column player2_nome text,
  add column player2_dano bigint,
  add column player2_cura bigint,
  add column player3_nome text,
  add column player3_dano bigint,
  add column player3_cura bigint,
  add column player4_nome text,
  add column player4_dano bigint,
  add column player4_cura bigint,
  add column player5_nome text,
  add column player5_dano bigint,
  add column player5_cura bigint,
  add column player6_nome text,
  add column player6_dano bigint,
  add column player6_cura bigint,
  add column player7_nome text,
  add column player7_dano bigint,
  add column player7_cura bigint,
  add column player8_nome text,
  add column player8_dano bigint,
  add column player8_cura bigint;

comment on column split_logs.player1_nome is 'Cópia denormalizada de membros[0].name — colunas rígidas até 8 players, pedido do usuário pra ler sem desmontar o jsonb.';
