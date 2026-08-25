-- ============================================================================
-- Tibia Party Manager — soft delete de drops
-- ============================================================================
-- Pedido do usuário em 2026-08-26: "na verdade pode fazer ja" (soft delete de
-- Drops no Log de Drops). Até aqui `ILootDropRepository.delete()` existia na
-- interface mas fazia um DELETE de verdade (`delete().eq('id', id)`) e nunca
-- foi ligado a nenhum botão da UI — dead code. Agora vira soft delete, mesmo
-- padrão já usado em `serviceiros.hidden`/`split_logs.hidden`: nunca apaga a
-- linha de verdade, só marca `hidden=true`. Botão 🗑️ com confirmação
-- (window.confirm) em cada linha da LootTable.
-- ============================================================================

alter table drops add column if not exists hidden boolean not null default false;

comment on column drops.hidden is 'Soft delete — nunca apagar a linha de verdade, só marcar true. findByAccount() sempre filtra hidden=false.';
