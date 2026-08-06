import type { BossMechanic } from '@/types';
import type { IBossRepository } from '../interfaces';
import { mockBosses } from '@/mocks/data/bosses';

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export class MockBossRepository implements IBossRepository {
  async findAll(): Promise<BossMechanic[]> {
    await delay();
    return mockBosses;
  }

  async findById(id: string): Promise<BossMechanic | null> {
    await delay();
    return mockBosses.find((b) => b.id === id) ?? null;
  }
}
