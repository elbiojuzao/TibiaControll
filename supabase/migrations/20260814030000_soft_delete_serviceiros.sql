-- ============================================================================
-- Tibia Party Manager — exclusão suave (soft delete) de Serviceiros
-- ============================================================================
-- Pedido explícito do usuário em 2026-08-14: "excluir" um serviceiro não deve
-- apagar o registro de verdade (isso já esbarrava na FK on delete restrict de
-- drop_services.serviceiro_id, criada de propósito pra não perder histórico —
-- ver migration 20260806000000). Comportamento novo, definido pelo usuário:
--   1. O serviceiro NUNCA é apagado — só marcado como `hidden = true`, sumindo
--      da lista normal. O histórico em drop_services fica intacto (o registro
--      ainda existe, só escondido) — cogitado inicialmente desvincular dos
--      drops, mas o usuário decidiu manter: "melhor não remover já que
--      iremos fazer um soft delete que apenas esconde".
--   2. Se o usuário cadastrar de novo um serviceiro com o MESMO telefone, o
--      registro escondido é reaproveitado (reativado com os dados novos) em
--      vez de criar um duplicado — "como se tivesse desexcluído".
-- Toda essa lógica fica no HttpServiceiroRepository (services/repositories/
-- http/http-serviceiro-repository.ts), não em trigger/function do Postgres.
-- ============================================================================

alter table serviceiros add column if not exists hidden boolean not null default false;

comment on column serviceiros.hidden is 'Soft delete — true = "excluído" pelo usuário (some da lista normal, mas o registro continua no banco). Reativado automaticamente se alguém cadastrar de novo um serviceiro com o mesmo phone_number nessa conta.';

create index if not exists idx_serviceiros_account_hidden on serviceiros(account_id, hidden);
