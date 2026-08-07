import type { ItemClassification, TierCalculationInput, TierCalculationResult, TierRouteResult } from '@/types';
import {
  MAX_TIER_BY_CLASSIFICATION,
  FUSION_GOLD_COST,
  CONVERGENCE_GOLD_COST,
  FUSION_DUST_COST,
  FUSION_EXALTED_CORE_COST,
  FUSION_SUCCESS_CHANCE_PERCENT,
  CONVERGENCE_DUST_COST,
  CONVERGENCE_EXALTED_CORE_COST,
  CONVERGENCE_SUCCESS_CHANCE_PERCENT,
} from './tier-cost-data';

/**
 * Fusão/Convergência sempre consome 2 itens IDÊNTICOS do mesmo tier — nenhum dos dois
 * é "de graça", nem o que você já tem: pra ter 1 item no tier alvo você precisa de 2 no
 * tier anterior, que por sua vez precisam de 2 cada no tier anterior a esse, e assim
 * por diante (tier N precisa de 2^N itens tier 0 no total). Isso forma uma árvore de
 * fusões: pra chegar em `targetTier`, o nível que produz o tier T precisa de
 * `2^(targetTier - T)` fusões (dobra a cada nível abaixo do topo) — só o nível mais
 * baixo (a partir de `currentTier`) de fato compra itens novos; os níveis acima só
 * consomem o que já foi produzido pelo nível de baixo.
 */
function buildRoute(
  route: 'fusion' | 'convergence',
  currentTier: number,
  targetTier: number,
  itemValue: number,
  goldByTargetTier: Record<number, number>,
  dustCost: number,
  exaltedCoreCost: number,
  successChancePercent: number,
): TierRouteResult {
  const steps: TierRouteResult['steps'] = [];

  for (let toTier = currentTier + 1; toTier <= targetTier; toTier++) {
    const fromTier = toTier - 1;
    const fusionsAtThisLevel = 2 ** (targetTier - toTier);
    const stepGoldCost = goldByTargetTier[toTier] ?? 0;

    const goldCost = fusionsAtThisLevel * stepGoldCost;
    const stepDustCost = fusionsAtThisLevel * dustCost;
    const stepExaltedCoreCost = fusionsAtThisLevel * exaltedCoreCost;
    const itemsCount = fromTier === currentTier ? fusionsAtThisLevel * 2 : 0;
    const itemsCost = itemsCount * itemValue;

    steps.push({
      fromTier,
      toTier,
      goldCost,
      dustCost: stepDustCost,
      exaltedCoreCost: stepExaltedCoreCost,
      itemsCost,
      itemsCount,
      fusionsCount: fusionsAtThisLevel,
      totalCost: goldCost + itemsCost,
    });
  }

  return {
    route,
    successChancePercent,
    steps,
    totalGold: steps.reduce((sum, s) => sum + s.goldCost, 0),
    totalDust: steps.reduce((sum, s) => sum + s.dustCost, 0),
    totalExaltedCores: steps.reduce((sum, s) => sum + s.exaltedCoreCost, 0),
    totalItemsCost: steps.reduce((sum, s) => sum + s.itemsCost, 0),
    totalItemsCount: steps.reduce((sum, s) => sum + s.itemsCount, 0),
    grandTotal: steps.reduce((sum, s) => sum + s.totalCost, 0),
  };
}

/**
 * Custo de 1 tentativa por etapa (sem valor esperado/retries), acumulado do tier atual ao tier alvo.
 * Convergence Fusion só existe oficialmente para Classificação 4 (regra do Exaltation Forge).
 */
export function calculateTierCost(input: TierCalculationInput): TierCalculationResult {
  const { classification, itemValue } = input;
  const maxTier = MAX_TIER_BY_CLASSIFICATION[classification];
  const currentTier = Math.max(0, Math.min(input.currentTier, maxTier));
  const targetTier = Math.max(currentTier, Math.min(input.targetTier, maxTier));

  const fusion = buildRoute(
    'fusion',
    currentTier,
    targetTier,
    itemValue,
    FUSION_GOLD_COST[classification],
    FUSION_DUST_COST,
    FUSION_EXALTED_CORE_COST,
    FUSION_SUCCESS_CHANCE_PERCENT,
  );

  const result: TierCalculationResult = {
    classification,
    currentTier,
    targetTier,
    fusion,
  };

  if (classification === 4) {
    result.convergence = buildRoute(
      'convergence',
      currentTier,
      targetTier,
      itemValue,
      CONVERGENCE_GOLD_COST,
      CONVERGENCE_DUST_COST,
      CONVERGENCE_EXALTED_CORE_COST,
      CONVERGENCE_SUCCESS_CHANCE_PERCENT,
    );
  }

  return result;
}

export function getMaxTier(classification: ItemClassification): number {
  return MAX_TIER_BY_CLASSIFICATION[classification];
}
