-- ============================================================================
-- Mundo (servidor) do Tibia em accounts
-- ============================================================================
-- Pedido do usuário em 2026-09-16: mostrar na topbar quantas Plunder Patriarch
-- morreram (kill statistics do TibiaData), que é uma API por MUNDO — precisa
-- saber em qual servidor os personagens da party jogam (ex: Collabra). Sem
-- lugar nenhum no banco guardando isso ainda; confirmado com o usuário que o
-- ideal é um campo novo em accounts, editável em Configurações (mesmo modelo
-- de account.party_name).
-- ============================================================================

alter table accounts add column if not exists world text;

comment on column accounts.world is 'Mundo (servidor) do Tibia onde os personagens da party jogam (ex: Collabra) — usado só pra consultar kill statistics do TibiaData por criatura (ver businessLogic.creatureKillStats). Opcional/null até o usuário configurar em Configurações; widgets que dependem disso ficam escondidos enquanto for null.';
