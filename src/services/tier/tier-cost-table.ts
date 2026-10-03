import {
  CONVERGENCE_GOLD_COST,
  CONVERGENCE_TRANSFER_EXALTED_CORE_COST,
  CONVERGENCE_TRANSFER_GOLD_COST,
  FUSION_GOLD_COST,
  TRANSFER_EXALTED_CORE_COST,
  TRANSFER_GOLD_COST,
} from './tier-cost-data';

export interface TierCostCell {
  gold: number;
  /** Exalted Cores exigidos além do gold (0 = nenhum) */
  cores: number;
}

export interface TierCostRow {
  /** Tier de destino (o que o item tem DEPOIS da operação) */
  tier: number;
  fusion: TierCostCell;
  convergence: TierCostCell;
  /** null no tier 10: exigiria um doador tier 11, que não existe */
  transfer: TierCostCell | null;
  convergenceTransfer: TierCostCell;
}

export const TIER_COST_TABLE_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Custo em gold de UMA operação por tier de destino, Classificação 4 (a única com os 4
 * métodos). A Fusão consome 2 Exalted Cores por tentativa e a Convergência nenhum — ver
 * FUSION_EXALTED_CORE_COST. Fonte dos números: tier-cost-data.ts. */
export function buildTierCostRows(): TierCostRow[] {
  return TIER_COST_TABLE_TIERS.map((tier) => ({
    tier,
    fusion: { gold: FUSION_GOLD_COST[4][tier], cores: 2 },
    convergence: { gold: CONVERGENCE_GOLD_COST[tier], cores: 0 },
    transfer: TRANSFER_GOLD_COST[tier] === undefined
      ? null
      : { gold: TRANSFER_GOLD_COST[tier], cores: TRANSFER_EXALTED_CORE_COST[tier] },
    convergenceTransfer: {
      gold: CONVERGENCE_TRANSFER_GOLD_COST[tier],
      cores: CONVERGENCE_TRANSFER_EXALTED_CORE_COST[tier],
    },
  }));
}

/** Notação "kk" da comunidade, sem sinal e com vírgula decimal: 20.000.000 → "20kk",
 * 2.500.000.000 → "2,5kkk". (formatGoldKK do Dashboard sempre põe "+", o que não faz sentido
 * pra um custo.) */
export function formatCostKk(value: number): string {
  let abs = value;
  let suffix = '';
  while (abs >= 1000) {
    abs /= 1000;
    suffix += 'k';
  }
  return `${String(Math.round(abs * 100) / 100).replace('.', ',')}${suffix}`;
}
