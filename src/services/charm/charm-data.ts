import type { CharmDefinition } from '@/types';

/**
 * Custos oficiais do sistema de Charms (tibiawiki.com.br/wiki/Charms), convertidos de
 * incremental (como a wiki lista) para acumulado desde o zero. Ver memória "regras-charm-planner"
 * antes de atualizar estes valores.
 */
export const MAJOR_CHARMS: CharmDefinition[] = [
  { id: 'curse', name: 'Curse', category: 'major', cumulativeCost: [360, 900, 2700] },
  { id: 'divine-wrath', name: 'Divine Wrath', category: 'major', cumulativeCost: [600, 1500, 4500] },
  { id: 'dodge', name: 'Dodge', category: 'major', cumulativeCost: [240, 600, 1800] },
  { id: 'enflame', name: 'Enflame', category: 'major', cumulativeCost: [400, 1000, 3000] },
  { id: 'freeze', name: 'Freeze', category: 'major', cumulativeCost: [320, 800, 2400] },
  { id: 'low-blow', name: 'Low Blow', category: 'major', cumulativeCost: [800, 2000, 6000] },
  { id: 'parry', name: 'Parry', category: 'major', cumulativeCost: [400, 1000, 3000] },
  { id: 'poison', name: 'Poison', category: 'major', cumulativeCost: [240, 600, 1800] },
  { id: 'savage-blow', name: 'Savage Blow', category: 'major', cumulativeCost: [800, 2000, 6000] },
  { id: 'wound', name: 'Wound', category: 'major', cumulativeCost: [240, 600, 1800] },
  { id: 'zap', name: 'Zap', category: 'major', cumulativeCost: [320, 800, 2400] },
  { id: 'carnage', name: 'Carnage', category: 'major', cumulativeCost: [600, 1500, 4500] },
  { id: 'overpower', name: 'Overpower', category: 'major', cumulativeCost: [600, 1500, 4500] },
  { id: 'overflux', name: 'Overflux', category: 'major', cumulativeCost: [600, 1500, 4500] },
];

/** Todos os Minor Charms custam igual: 100 / 250 / 475 (acumulado) */
const MINOR_COST: [number, number, number] = [100, 250, 475];

export const MINOR_CHARMS: CharmDefinition[] = [
  'Adrenaline Burst',
  'Bless',
  'Cleanse',
  'Cripple',
  'Fatal Hold',
  'Gut',
  'Numb',
  'Scavenge',
  'Vampiric Embrace',
  "Void's Call",
  'Void Inversion',
].map((name) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  name,
  category: 'minor' as const,
  cumulativeCost: MINOR_COST,
}));

export const ALL_CHARMS: CharmDefinition[] = [...MAJOR_CHARMS, ...MINOR_CHARMS];
