-- ============================================================================
-- Tibia Party Manager — duração da sessão em split_logs
-- ============================================================================
-- Pedido do usuário em 2026-08-23: "o dano medio eu acho que esta errado pois a
-- hunt ela pode durar 2 ou 3 horas tem que analisar isso antes talvez mais uma
-- coluna no banco". A "Média por player" da aba Splits (playerAveragesByType em
-- SplitsHistoricoPage.tsx) até então media dano/cura TOTAL por split, sem levar
-- em conta a duração — uma hunt de 3h naturalmente tem mais dano bruto que uma
-- de 1h, então a média ficava distorcida. Correção: normalizar por HORA
-- (dano/cura ÷ duração), exigindo guardar a duração de cada split.
--
-- O cabeçalho "Session: HH:MMh" do Party Hunt Analyzer já vinha dentro de
-- `log_bruto` desde sempre (mesma descoberta do backfill de damage/healing,
-- ver migration 20260822000000) — só nunca tinha sido extraído/guardado.
-- ============================================================================

alter table split_logs add column duracao_minutos integer;

comment on column split_logs.duracao_minutos is 'Duração total da sessão em minutos, extraída do cabeçalho "Session: HH:MMh" do log — usada pra normalizar médias de dano/cura por hora no Histórico de Splits.';
