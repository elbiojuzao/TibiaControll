import type { CreatePartyEventDto, PartyEvent } from '@/types';
import type { IPartyEventRepository } from '../interfaces';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const store = new Map<string, PartyEvent[]>();

export class MockPartyEventRepository implements IPartyEventRepository {
  async create(accountId: string, dto: CreatePartyEventDto): Promise<PartyEvent> {
    await delay();
    const created: PartyEvent = {
      id: crypto.randomUUID(),
      accountId,
      createdAt: new Date().toISOString(),
      ...dto,
    };
    const list = store.get(accountId) ?? [];
    list.push(created);
    store.set(accountId, list);
    return created;
  }

  async findByAccount(accountId: string): Promise<PartyEvent[]> {
    await delay();
    return store.get(accountId) ?? [];
  }
}
