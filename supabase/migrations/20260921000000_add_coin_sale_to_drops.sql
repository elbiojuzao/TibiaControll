-- ============================================================================
-- Venda de item em Tibia Coins (valor da coin do dia + coins vendidas)
-- ============================================================================
-- Pedido do usuário em 2026-09-21: no modal de editar drop, ao lado de "Valor
-- Total" um alternador "kk" <-> "coins". No modo coins aparecem dois campos
-- novos: o valor da coin (em gold) no dia da venda e quantas coins o item foi
-- vendido; o Valor Total (em gold) passa a ser calculado sozinho como
-- valor_coin * venda_valor_coin. valor_total continua sendo a fonte de verdade
-- pro resto do app (KPIs, split, mensagens) — os campos novos só guardam de
-- onde ele veio. Ambos null = venda em kk/gold normal (todos os drops atuais).
-- ============================================================================

alter table drops add column if not exists valor_coin bigint check (valor_coin is null or valor_coin >= 0);
alter table drops add column if not exists venda_valor_coin bigint check (venda_valor_coin is null or venda_valor_coin >= 0);

comment on column drops.valor_coin is 'Cotação da Tibia Coin em gold no dia da venda (ex: 45000). null = item não foi vendido em coins.';
comment on column drops.venda_valor_coin is 'Quantidade de Tibia Coins pela qual o item foi vendido. valor_total = valor_coin * venda_valor_coin quando ambos preenchidos. null = venda em kk/gold.';
