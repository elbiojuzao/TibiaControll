-- ============================================================================
-- split_logs — soft delete (2026-08-19/20, pedido do usuário)
-- ============================================================================
-- No modal de dia do Calendário, ao lado de "Boss (individual)"/"Hunt (individual)"
-- tem um botão de excluir (com confirmação) — pedido explícito: "não sera realmente
-- excluido sera um softdel apenas esconder". Mesmo padrão já usado em
-- serviceiros.hidden (migration 20260814030000_soft_delete_serviceiros.sql): o
-- registro continua no banco pra sempre, só some das consultas normais.
-- ============================================================================

alter table split_logs add column if not exists hidden boolean not null default false;

comment on column split_logs.hidden is 'Soft delete — true = "excluído" pelo usuário no modal do Calendário (com confirmação), mas o registro continua no banco. Nunca reativado automaticamente (diferente de serviceiros.hidden) — não existe fluxo de "recriar" um split.';
