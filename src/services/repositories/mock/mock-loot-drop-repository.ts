import type { LootDrop, CreateLootDropDto, LootDropFilters } from '@/types';
import type { ILootDropRepository } from '../interfaces';
import { mockLootDrops } from '@/mocks/data/loot-drops';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

let dropsStore = [...mockLootDrops];
// Soft delete (2026-08-26) — mesma ideia de serviceiros/split_logs: LootDrop não expõe
// `hidden` no tipo de domínio, ninguém fora do repository precisa saber disso.
const hiddenIds = new Set<string>();

export class MockLootDropRepository implements ILootDropRepository {
  async findByAccount(accountId: string, filters?: LootDropFilters): Promise<LootDrop[]> {
    await delay();
    let results = dropsStore.filter((d) => d.accountId === accountId && !hiddenIds.has(d.id));

    if (filters?.bossName) {
      results = results.filter((d) =>
        d.bossName.toLowerCase().includes(filters.bossName!.toLowerCase()),
      );
    }
    if (filters?.sold !== undefined) {
      results = results.filter((d) => d.sold === filters.sold);
    }
    if (filters?.looter) {
      results = results.filter((d) =>
        d.looter.toLowerCase().includes(filters.looter!.toLowerCase()),
      );
    }
    if (filters?.dateFrom) {
      const from = parseDate(filters.dateFrom);
      results = results.filter((d) => parseDate(d.date) >= from);
    }
    if (filters?.dateTo) {
      const to = parseDate(filters.dateTo);
      results = results.filter((d) => parseDate(d.date) <= to);
    }

    return results.sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }

  async findById(id: string): Promise<LootDrop | null> {
    await delay(100);
    return dropsStore.find((d) => d.id === id) ?? null;
  }

  async create(accountId: string, dto: CreateLootDropDto): Promise<LootDrop> {
    await delay();
    const drop: LootDrop = {
      id: crypto.randomUUID(),
      accountId,
      ...dto,
      sold: dto.sold ?? false,
    };
    dropsStore.unshift(drop);
    return drop;
  }

  async update(id: string, dto: Partial<CreateLootDropDto>): Promise<LootDrop> {
    await delay();
    const index = dropsStore.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Drop nao encontrado');
    // '' e o sentinela usado pelo form pra "limpar" a data de venda (mesma semantica do HttpLootDropRepository)
    const patch = dto.saleDate === '' ? { ...dto, saleDate: undefined } : dto;
    dropsStore[index] = { ...dropsStore[index], ...patch };
    return dropsStore[index];
  }

  async delete(id: string): Promise<void> {
    await delay();
    hiddenIds.add(id);
  }

  static reset(): void {
    dropsStore = [...mockLootDrops];
    hiddenIds.clear();
  }
}

function parseDate(dateStr: string): number {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}
