import type { Serviceiro, CreateServiceiroDto } from '@/types';
import type { IServiceiroRepository } from '../interfaces';
import { mockServiceiros } from '@/mocks/data/serviceiros';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

let serviceirosStore = [...mockServiceiros];

export class MockServiceiroRepository implements IServiceiroRepository {
  async findByAccount(accountId: string): Promise<Serviceiro[]> {
    await delay();
    return serviceirosStore.filter((s) => s.accountId === accountId);
  }

  async create(accountId: string, dto: CreateServiceiroDto): Promise<Serviceiro> {
    await delay();
    const serviceiro: Serviceiro = {
      id: crypto.randomUUID(),
      accountId,
      name: dto.name,
      characterName: dto.characterName,
      phoneNumber: dto.phoneNumber,
      vocations: dto.vocations,
    };
    serviceirosStore.push(serviceiro);
    return serviceiro;
  }

  async update(id: string, dto: Partial<CreateServiceiroDto>): Promise<Serviceiro> {
    await delay();
    const index = serviceirosStore.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Serviceiro nao encontrado');
    serviceirosStore[index] = { ...serviceirosStore[index], ...dto };
    return serviceirosStore[index];
  }

  async delete(id: string): Promise<void> {
    await delay();
    serviceirosStore = serviceirosStore.filter((s) => s.id !== id);
  }

  /** Util para testes — reseta o store */
  static reset(): void {
    serviceirosStore = [...mockServiceiros];
  }
}
