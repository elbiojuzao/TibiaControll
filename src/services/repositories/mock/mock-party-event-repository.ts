import type { CreatePartyEventDto, PartyEvent } from '@/types';
import type { IPartyEventRepository } from '../interfaces';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

/** Mural global (2026-08-28) — antes era um Map por accountId (privado por conta); virou
 * lista única porque todo mundo autenticado lê todos os eventos agora, só a CRIAÇÃO é
 * restrita a conta admin (ver IPartyEventRepository). */
let store: PartyEvent[] = [];

export class MockPartyEventRepository implements IPartyEventRepository {
  async create(accountId: string, dto: CreatePartyEventDto): Promise<PartyEvent> {
    await delay();
    const created: PartyEvent = {
      id: crypto.randomUUID(),
      accountId,
      createdAt: new Date().toISOString(),
      ...dto,
    };
    store = [created, ...store];
    return created;
  }

  async findAll(): Promise<PartyEvent[]> {
    await delay();
    return store;
  }

  async update(id: string, dto: Partial<CreatePartyEventDto>): Promise<PartyEvent> {
    await delay();
    const index = store.findIndex((ev) => ev.id === id);
    if (index === -1) throw new Error('Evento nao encontrado');
    store[index] = { ...store[index], ...dto };
    return store[index];
  }

  async delete(id: string): Promise<void> {
    await delay();
    store = store.filter((ev) => ev.id !== id);
  }
}
