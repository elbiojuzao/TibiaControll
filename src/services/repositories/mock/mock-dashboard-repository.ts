import type { DashboardKpis, MemberXpStats } from '@/types';
import type { IDashboardRepository } from '../interfaces';
import { mockDashboardKpis } from '@/mocks/data/dashboard-kpis';
import { mockMemberXpStats } from '@/mocks/data/member-xp-stats';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

const EMPTY_KPIS: DashboardKpis = {
  kksPlunderInd: 0,
  kksHunt: 0,
  qtdBags: 0,
  qtdPlunders: 0,
  totalInd: 0,
  kksBagsInd: 0,
  kksBoss: 0,
};

export class MockDashboardRepository implements IDashboardRepository {
  async getKpis(accountId: string): Promise<DashboardKpis> {
    await delay();
    return mockDashboardKpis[accountId] ?? EMPTY_KPIS;
  }

  async getMemberXpStats(accountId: string): Promise<Record<string, MemberXpStats>> {
    await delay();
    return mockMemberXpStats[accountId] ?? {};
  }
}
