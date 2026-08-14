import type { MemberXpStats } from '@/types';
import { MOCK_ACCOUNT_ID } from './accounts';

/** Chave interna: characterName */
export const mockMemberXpStats: Record<string, Record<string, MemberXpStats>> = {
  [MOCK_ACCOUNT_ID]: {
    Marugo: {
      xpOntem: '-+404.674.446',
      xp30Dias: '+3.975.022.582',
    },
    'Thanatos Celestial': {
      xpOntem: '+133.409.815',
      xp30Dias: '+3.942.915.127',
    },
    'Thor Zynz': {
      xpOntem: '-+476.736.286',
      xp30Dias: '+3.535.944.665',
    },
    'Koe Psciko': {
      xpOntem: '+197.664.728',
      xp30Dias: '+4.354.607.931',
    },
  },
};
