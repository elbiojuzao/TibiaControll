import type { Account } from '@/types';

export const MOCK_ACCOUNT_ID = 'acc-demo-001';

export const mockAccount: Account = {
  id: MOCK_ACCOUNT_ID,
  partyName: 'Thanatos PT',
  type: 'party',
  createdAt: '2023-01-15T00:00:00.000Z',
};
