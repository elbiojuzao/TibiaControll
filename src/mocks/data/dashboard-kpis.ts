import type { DashboardKpis } from '@/types';
import { MOCK_ACCOUNT_ID } from './accounts';

export const mockDashboardKpis: Record<string, DashboardKpis> = {
  [MOCK_ACCOUNT_ID]: {
    qtdBags: 14,
    kksBagsInd: 642_375_000,
  },
};
