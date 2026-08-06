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
    const goldCost = goldByTargetTier[toTier] ?? 0;
    const itemsCost = itemValue * 2;
    steps.push({
      fromTier: toTier - 1,
      toTier,
      goldCost,
      dustCost,
      exaltedCoreCost,
      itemsCost,
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
