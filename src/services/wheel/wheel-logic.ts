import type { WheelDomainId, WheelSliceAllocation } from '@/types';
import { WHEEL_SLICE_GEOMETRY, slicesAdjacent } from './wheel-geometry';
import { ringPointCap, DOMAIN_TOTAL_POINTS } from './wheel-slice-content';
import { REVELATION_STAGE_THRESHOLDS } from './wheel-perks-data';

/** Regras de preenchimento/gating da roda, iguais em qualquer vocação (conteúdo é fixo por
 * posição — só o total de pontos investidos importa aqui). Dado real (TibiaWiki: "assim que
 * uma fatia é preenchida por completo, dá pra investir nas fatias adjacentes") — corrigido
 * em 2026-09-03: uma fatia desbloqueia assim que QUALQUER fatia geometricamente ADJACENTE
 * (mesmo domínio, `slicesAdjacent` em wheel-geometry.ts — anel anterior/seguinte que se
 * sobrepõe em ângulo, OU vizinha lateral no MESMO anel) estiver no máximo. Isso substitui 2
 * simplificações anteriores erradas: "anel inteiro anterior precisa estar cheio" e depois
 * "só 1 fatia qualquer do anel anterior" — nenhuma delas cobria acesso LATERAL (ex: um
 * Vessel Resonance do meio do anel 2 acessado pelo vizinho do lado, confirmado no print do
 * usuário), que só sai certo com adjacência geométrica de verdade. */

export type AllocationMap = Record<string, WheelSliceAllocation>;

export function slicesInDomain(domain: WheelDomainId) {
  return WHEEL_SLICE_GEOMETRY.filter((s) => s.domain === domain);
}

function isSliceMaxed(sliceId: string, allocations: AllocationMap): boolean {
  const slice = WHEEL_SLICE_GEOMETRY.find((s) => s.id === sliceId);
  if (!slice) return false;
  return (allocations[sliceId]?.points ?? 0) >= ringPointCap(slice.ring);
}

/** Uma fatia só pode receber pontos se ring===0, ou se PELO MENOS 1 fatia geometricamente
 * adjacente (mesmo domínio — radial pro anel vizinho ou lateral no mesmo anel) já estiver
 * no máximo. */
export function isSliceUnlocked(sliceId: string, allocations: AllocationMap): boolean {
  const slice = WHEEL_SLICE_GEOMETRY.find((s) => s.id === sliceId);
  if (!slice) return false;
  if (slice.ring === 0) return true;
  return WHEEL_SLICE_GEOMETRY.some((other) => slicesAdjacent(slice, other) && isSliceMaxed(other.id, allocations));
}

export function domainTotalPoints(domain: WheelDomainId, allocations: AllocationMap): number {
  return slicesInDomain(domain).reduce((sum, s) => sum + (allocations[s.id]?.points ?? 0), 0);
}

export function domainRevelationStage(domain: WheelDomainId, allocations: AllocationMap): 0 | 1 | 2 | 3 {
  const total = domainTotalPoints(domain, allocations);
  if (total >= REVELATION_STAGE_THRESHOLDS.stage3) return 3;
  if (total >= REVELATION_STAGE_THRESHOLDS.stage2) return 2;
  if (total >= REVELATION_STAGE_THRESHOLDS.stage1) return 1;
  return 0;
}

export function wheelTotalPoints(allocations: AllocationMap): number {
  return Object.values(allocations).reduce((sum, a) => sum + (a?.points ?? 0), 0);
}

export function wheelMaxPoints(): number {
  return DOMAIN_TOTAL_POINTS * 4;
}
