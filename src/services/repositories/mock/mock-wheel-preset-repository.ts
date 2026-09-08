import type { CreateWheelPresetDto, WheelPreset } from '@/types';
import type { IWheelPresetRepository } from '../interfaces';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

let store: WheelPreset[] = [];

export class MockWheelPresetRepository implements IWheelPresetRepository {
  async findByAccount(accountId: string): Promise<WheelPreset[]> {
    await delay();
    return store.filter((p) => p.accountId === accountId);
  }

  async create(accountId: string, dto: CreateWheelPresetDto): Promise<WheelPreset> {
    await delay();
    const created: WheelPreset = { id: crypto.randomUUID(), accountId, createdAt: new Date().toISOString(), ...dto };
    store = [created, ...store];
    return created;
  }

  async delete(id: string): Promise<void> {
    await delay();
    store = store.filter((p) => p.id !== id);
  }
}
