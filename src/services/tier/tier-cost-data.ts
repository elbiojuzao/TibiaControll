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
export const FUSION_EXALTED_CORE_COST = 1;
export const FUSION_SUCCESS_CHANCE_PERCENT = 65;

export const CONVERGENCE_DUST_COST = 130;
export const CONVERGENCE_EXALTED_CORE_COST = 0;
export const CONVERGENCE_SUCCESS_CHANCE_PERCENT = 100;
