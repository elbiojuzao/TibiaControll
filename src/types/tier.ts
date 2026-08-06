/** Classificação do item no Exaltation Forge (1 a 4) — define o tier máximo aprimorável */
export type ItemClassification = 1 | 2 | 3 | 4;

/** Custo de uma única etapa de tier (ex: 2 -> 3) */
export interface TierStepCost {
  fromTier: number;
  toTier: number;
  /** Gold cost da tabela oficial para esta etapa */
  goldCost: number;
  dustCost: number;
  exaltedCoreCost: number;
}

export interface TierCalculationInput {
  classification: ItemClassification;
  currentTier: number;
  targetTier: number;
  /** Valor de mercado de 1 unidade do item, usado para custear os itens consumidos em cada etapa */
  itemValue: number;
}

export interface TierRouteResult {
  /** 'fusion' = rota de sorte (65%); 'convergence' = rota garantida (100%), só existe p/ classe 4 */
  route: 'fusion' | 'convergence';
  successChancePercent: number;
  steps: (TierStepCost & { itemsCost: number; totalCost: number })[];
  totalGold: number;
  totalDust: number;
  totalExaltedCores: number;
  totalItemsCost: number;
  grandTotal: number;
}

export interface TierCalculationResult {
  classification: ItemClassification;
  currentTier: number;
  targetTier: number;
  fusion: TierRouteResult;
  /** undefined quando a classificação não é 4 (convergência não existe para classe 1-3) */
  convergence?: TierRouteResult;
}
