import type { CreateWheelBuildDto, WheelBuild } from '@/types';
import type { IWheelBuildRepository } from '../interfaces';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

let store: WheelBuild[] = [];

export class MockWheelBuildRepository implements IWheelBuildRepository {
  async findByAccount(accountId: string): Promise<WheelBuild[]> {
    await delay();
    return store.filter((b) => b.accountId === accountId);
  }

  async create(accountId: string, dto: CreateWheelBuildDto): Promise<WheelBuild> {
    await delay();
    const created: WheelBuild = { id: crypto.randomUUID(), accountId, createdAt: new Date().toISOString(), ...dto };
    store = [created, ...store];
    return created;
  }

  async delete(id: string): Promise<void> {
    await delay();
    store = store.filter((b) => b.id !== id);
  }
}
