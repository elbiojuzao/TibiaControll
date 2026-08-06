import type { BossMechanic } from '@/types';

export const mockBosses: BossMechanic[] = [
  {
    id: 'boss-001',
    name: 'Bakragore',
    roomDurationSeconds: 25 * 60,
    loopDurationSeconds: 90,
  },
  {
    id: 'boss-002',
    name: 'Goshnar\'s Megalomania',
    roomDurationSeconds: 30 * 60,
    loopDurationSeconds: 120,
  },
  {
    id: 'boss-003',
    name: 'Magma Bubble',
    roomDurationSeconds: 20 * 60,
    loopDurationSeconds: 60,
  },
  {
    id: 'boss-004',
    name: 'The Rootkraken',
    roomDurationSeconds: 25 * 60,
    loopDurationSeconds: 90,
  },
  {
    id: 'boss-005',
    name: 'Plunder Patriarch',
    roomDurationSeconds: 22 * 60,
    loopDurationSeconds: 75,
  },
];
