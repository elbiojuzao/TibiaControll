import type { CharmLevel, CharmPlanInput, CharmPlanResult, CharmCostRow } from '@/types';
import { MAJOR_CHARMS, MINOR_CHARMS } from './charm-data';

function buildRows(charms: typeof MAJOR_CHARMS, selections: Record<string, CharmLevel>): CharmCostRow[] {
  return charms.map((charm) => {
    const level = selections[charm.id] ?? 0;
    const cost = level > 0 ? charm.cumulativeCost[level - 1] : 0;
    return { charmId: charm.id, name: charm.name, level, cost };
  });
}

export function calculateCharmPlan(input: CharmPlanInput): CharmPlanResult {
  const majorRows = buildRows(MAJOR_CHARMS, input.selections);
  const minorRows = buildRows(MINOR_CHARMS, input.selections);

  const majorRequired = majorRows.reduce((sum, r) => sum + r.cost, 0);
  const minorRequired = minorRows.reduce((sum, r) => sum + r.cost, 0);

  return {
    major: {
      rows: majorRows,
      required: majorRequired,
      remaining: input.availableMajorPoints - majorRequired,
    },
    minor: {
      rows: minorRows,
      required: minorRequired,
      remaining: input.availableMinorEchoes - minorRequired,
    },
  };
}
