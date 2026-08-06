import type { Hunt, CreateHuntDto, HuntSummary } from '@/types';
import type { IHuntRepository } from '../interfaces';
import { mockHunts } from '@/mocks/data/hunts';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

let huntsStore = [...mockHunts];

export class MockHuntRepository implements IHuntRepository {
  async findByAccount(accountId: string): Promise<Hunt[]> {
    await delay();
    return huntsStore.filter((h) => h.accountId === accountId);
  }

  async findByDate(accountId: string, date: string): Promise<Hunt[]> {
    await delay();
    return huntsStore.filter((h) => h.accountId === accountId && h.date === date);
  }

  async create(accountId: string, dto: CreateHuntDto): Promise<Hunt> {
    await delay();
    const hunt: Hunt = { id: crypto.randomUUID(), accountId, ...dto };
    huntsStore.push(hunt);
    return hunt;
  }

  async getSummary(accountId: string, period: HuntSummary['period']): Promise<HuntSummary> {
    await delay();
    const hunts = huntsStore.filter((h) => h.accountId === accountId);
    return {
      period,
      totalProfit: hunts.reduce((sum, h) => sum + h.profitTotal, 0),
      totalXp: hunts.reduce((sum, h) => sum + h.xpGained, 0),
      huntCount: hunts.length,
    };
  }
}
