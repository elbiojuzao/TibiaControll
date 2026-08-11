import type { MemberXpStats } from '@/types';
import { MOCK_ACCOUNT_ID } from './accounts';

/** Chave interna: characterName */
export const mockMemberXpStats: Record<string, Record<string, MemberXpStats>> = {
  [MOCK_ACCOUNT_ID]: {
    Marugo: {
      xpOntem: '-+404.674.446',
      xp30Dias: '+3.975.022.582',
      metas: {
        1650: 'Lvl Atingido', 1700: 'Lvl Atingido', 1750: 'Lvl Atingido', 1800: 'Lvl Atingido',
        1850: 'Lvl Atingido', 1900: 'Lvl Atingido', 1950: 'Lvl Atingido', 2000: 'Lvl Atingido',
        2050: '+068.844.172', 2100: '+141.997.753', 2150: '+219.089.729', 2200: '+300.200.523',
        2250: '+385.410.540', 2300: '+474.800.186', 2350: '+568.449.865', 2400: '+666.440.050',
      },
    },
    'Thanatos Celestial': {
      xpOntem: '+133.409.815',
      xp30Dias: '+3.942.915.127',
      metas: {
        1650: 'Lvl Atingido', 1700: 'Lvl Atingido', 1750: 'Lvl Atingido', 1800: 'Lvl Atingido',
        1850: 'Lvl Atingido', 1900: 'Lvl Atingido', 1950: 'Lvl Atingido', 2000: '+028.421.441',
        2050: '+097.768.390', 2100: '+170.921.971', 2150: '+248.013.947', 2200: '+329.124.741',
        2250: '+414.334.758', 2300: '+503.724.403', 2350: '+597.374.082', 2400: '+695.364.268',
      },
    },
    'Thor Zynz': {
      xpOntem: '-+476.736.286',
      xp30Dias: '+3.535.944.665',
      metas: {
        1650: 'Lvl Atingido', 1700: 'Lvl Atingido', 1750: 'Lvl Atingido', 1800: 'Lvl Atingido',
        1850: 'Lvl Atingido', 1900: 'Lvl Atingido', 1950: 'Lvl Atingido', 2000: 'Lvl Atingido',
        2050: 'Lvl Atingido', 2100: 'Lvl Atingido', 2150: 'Lvl Atingido', 2200: '+037.521.582',
        2250: '+122.731.599', 2300: '+212.121.244', 2350: '+305.770.923', 2400: '+403.761.109',
      },
    },
    'Koe Psciko': {
      xpOntem: '+197.664.728',
      xp30Dias: '+4.354.607.931',
      metas: {
        1650: 'Lvl Atingido', 1700: 'Lvl Atingido', 1750: 'Lvl Atingido', 1800: 'Lvl Atingido',
        1850: '+007.119.747', 1900: '+066.386.284', 1950: '+128.850.794', 2000: '+194.408.997',
        2050: '+263.755.946', 2100: '+336.909.527', 2150: '+414.001.504', 2200: '+495.112.298',
        2250: '+580.322.315', 2300: '+669.711.960', 2350: '+763.361.639', 2400: '+861.351.825',
      },
    },
  },
};
