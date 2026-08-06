import type { Hunt } from '@/types';
import { MOCK_ACCOUNT_ID } from './accounts';

export const mockHunts: Hunt[] = [
  {
    id: 'hunt-001',
    accountId: MOCK_ACCOUNT_ID,
    date: '05/06/2023',
    lootTotal: 12_500_000,
    wasteTotal: 3_200_000,
    profitTotal: 9_300_000,
    xpGained: 45_000_000,
    bossName: 'The Rootkraken',
  },
  {
    id: 'hunt-002',
    accountId: MOCK_ACCOUNT_ID,
    date: '18/07/2023',
    lootTotal: 8_900_000,
    wasteTotal: 2_800_000,
    profitTotal: 6_100_000,
    xpGained: 38_000_000,
    bossName: 'Plunder Patriarch',
  },
  {
    id: 'hunt-003',
    accountId: MOCK_ACCOUNT_ID,
    date: '02/09/2023',
    lootTotal: 15_200_000,
    wasteTotal: 4_100_000,
    profitTotal: 11_100_000,
    xpGained: 52_000_000,
    bossName: 'Goshnar\'s Megalomania',
  },
];
