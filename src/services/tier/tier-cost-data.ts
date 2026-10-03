import type { ItemClassification } from '@/types';

/**
 * Custos oficiais do Exaltation Forge (tibiawiki.com.br/wiki/Exaltation_Forge,
 * tibia.fandom.com/wiki/Equipment_Upgrade). Atualizar aqui se a CipSoft mudar os preços.
 */

export const MAX_TIER_BY_CLASSIFICATION: Record<ItemClassification, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 10,
};

/** Gold por etapa de Fusão (rota "sorte"), chave = tier de destino */
export const FUSION_GOLD_COST: Record<ItemClassification, Record<number, number>> = {
  1: { 1: 25_000 },
  2: { 1: 750_000, 2: 5_000_000 },
  3: { 1: 4_000_000, 2: 10_000_000, 3: 20_000_000 },
  4: {
    1: 8_000_000,
    2: 20_000_000,
    3: 40_000_000,
    4: 65_000_000,
    5: 100_000_000,
    6: 250_000_000,
    7: 750_000_000,
    8: 2_500_000_000,
    9: 8_000_000_000,
    10: 15_000_000_000,
  },
};

/** Gold por etapa de Convergence Fusion (rota "100% garantido") — só existe para Classificação 4 */
export const CONVERGENCE_GOLD_COST: Record<number, number> = {
  1: 55_000_000,
  2: 110_000_000,
  3: 170_000_000,
  4: 300_000_000,
  5: 875_000_000,
  6: 2_350_000_000,
  7: 6_950_000_000,
  8: 21_250_000_000,
  9: 50_000_000_000,
  10: 125_000_000_000,
};

export const FUSION_DUST_COST = 100;
export const FUSION_EXALTED_CORE_COST = 2;
export const FUSION_SUCCESS_CHANCE_PERCENT = 65;

export const CONVERGENCE_DUST_COST = 130;
export const CONVERGENCE_EXALTED_CORE_COST = 0;
export const CONVERGENCE_SUCCESS_CHANCE_PERCENT = 100;

/**
 * Transferência e Transferência por Convergência (tabela de custo por tier, 2026-10-02) —
 * valores atuais (pós Winter Update 2023) do código aberto do TibiaTools
 * (github.com/kik-tibia/tibiatools, src/lib/forge-calc.ts), conferidos contra a notícia
 * oficial do update (tibiaevents.com/exaltation-forge-enhancement: Convergence Transfer = só
 * Classificação 4, 160 Dust) e contra as nossas tabelas de Fusão/Convergência, que batem
 * EXATAMENTE com as dele. ATENÇÃO: a wiki do Igla ainda lista os preços ANTIGOS de transfer
 * (3.000.000, 6.000.000, 15.000.000...) — não usar.
 */

/** Gold da Transferência normal. Chave = tier RESULTANTE no item que recebe: o doador precisa
 * ser tier (chave+1), é destruído, e o receptor (tier 0) termina com 1 tier a menos que o
 * doador. Por isso não existe chave 10 (exigiria doador tier 11). Segue o padrão
 * TRANSFER[k] = FUSION[classe 4][k+1] (conferido nos testes). */
export const TRANSFER_GOLD_COST: Record<number, number> = {
  1: 20_000_000,
  2: 40_000_000,
  3: 65_000_000,
  4: 100_000_000,
  5: 250_000_000,
  6: 750_000_000,
  7: 2_500_000_000,
  8: 8_000_000_000,
  9: 15_000_000_000,
};

/** Exalted Cores da Transferência normal, mesma chave. Tiers 1–5 (1, 2, 5, 10, 15) confirmados
 * na wiki; 6–9 seguem a mesma série da Transferência por Convergência (TibiaTools) — a wiki
 * marcava esses tiers como "?", então são os únicos valores aqui não confirmados em 2 fontes. */
export const TRANSFER_EXALTED_CORE_COST: Record<number, number> = {
  1: 1, 2: 2, 3: 5, 4: 10, 5: 15, 6: 25, 7: 35, 8: 50, 9: 60,
};
export const TRANSFER_EXALTED_CORE_UNCONFIRMED_FROM_TIER = 6;
export const TRANSFER_DUST_COST = 100;

/** Gold da Transferência por Convergência (só Classificação 4, sem perda de tier: o receptor
 * termina no MESMO tier do doador). Chave = tier final. */
export const CONVERGENCE_TRANSFER_GOLD_COST: Record<number, number> = {
  1: 65_000_000,
  2: 165_000_000,
  3: 375_000_000,
  4: 800_000_000,
  5: 2_000_000_000,
  6: 5_250_000_000,
  7: 14_500_000_000,
  8: 42_500_000_000,
  9: 100_000_000_000,
  10: 300_000_000_000,
};

export const CONVERGENCE_TRANSFER_EXALTED_CORE_COST: Record<number, number> = {
  1: 1, 2: 2, 3: 5, 4: 10, 5: 15, 6: 25, 7: 35, 8: 50, 9: 60, 10: 85,
};
export const CONVERGENCE_TRANSFER_DUST_COST = 160;
