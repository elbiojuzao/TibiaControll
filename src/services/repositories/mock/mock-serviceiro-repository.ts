import type { Serviceiro, CreateServiceiroDto } from '@/types';
import type { IServiceiroRepository } from '../interfaces';
import { mockServiceiros } from '@/mocks/data/serviceiros';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

let serviceirosStore = [...mockServiceiros];
/** Espelha `hidden` do Http (soft delete) — não faz parte do tipo `Serviceiro` de
 * propósito, é um detalhe de armazenamento, não de domínio. Ver http-serviceiro-repository.ts
 * pro comportamento completo (aqui não desvincula de drops mock, só esconde/reativa). */
const hiddenIds = new Set<string>();

export class MockServiceiroRepository implements IServiceiroRepository {
  async findByAccount(accountId: string): Promise<Serviceiro[]> {
    await delay();
    return serviceirosStore.filter((s) => s.accountId === accountId && !hiddenIds.has(s.id));
  }

  async create(accountId: string, dto: CreateServiceiroDto): Promise<Serviceiro> {
    await delay();

    const hiddenMatch = serviceirosStore.find(
      (s) => s.accountId === accountId && s.phoneNumber === dto.phoneNumber && hiddenIds.has(s.id),
    );
    if (hiddenMatch) {
      hiddenIds.delete(hiddenMatch.id);
      const index = serviceirosStore.findIndex((s) => s.id === hiddenMatch.id);
      serviceirosStore[index] = { ...hiddenMatch, name: dto.name, characterName: dto.characterName, vocations: dto.vocations };
      return serviceirosStore[index];
    }

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
    hiddenIds.add(id);
  }

  /** Util para testes — reseta o store */
  static reset(): void {
    serviceirosStore = [...mockServiceiros];
    hiddenIds.clear();
  }
}
