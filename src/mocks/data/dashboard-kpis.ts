import type { DashboardKpis } from '@/types';
import { MOCK_ACCOUNT_ID } from './accounts';

export const mockDashboardKpis: Record<string, DashboardKpis> = {
  [MOCK_ACCOUNT_ID]: {
    kksPlunderInd: 277_750_000,
    qtdBags: 14,
    qtdPlunders: 17,
    totalInd: 1_199_670_312,
    kksBagsInd: 642_375_000,
  },
};
