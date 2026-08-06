import type { PartySettings } from '@/types';
import { MOCK_ACCOUNT_ID } from './accounts';

export const mockPartySettings: Record<string, PartySettings> = {
  [MOCK_ACCOUNT_ID]: {
    tcGoldRate: 45_000,
  },
};
