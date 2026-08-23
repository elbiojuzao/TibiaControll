import type { CreateSplitLogDto, SplitLog, SplitLogType } from '@/types';
import type { ISplitLogRepository } from '../interfaces';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const store = new Map<string, SplitLog[]>();
// Soft delete — mesma ideia de serviceiros.hidden, só que aqui como um Set à parte (SplitLog
// não expõe `hidden` no tipo de domínio, ninguém fora do repository precisa saber disso).
const hiddenKeys = new Set<string>();
const keyOf = (accountId: string, date: string, type: SplitLogType) => `${accountId}|${date}|${type}`;

export class MockSplitLogRepository implements ISplitLogRepository {
  async create(accountId: string, dto: CreateSplitLogDto): Promise<SplitLog> {
    await delay();
    const created: SplitLog = {
      id: crypto.randomUUID(),
      accountId,
      createdAt: new Date().toISOString(),
      // Mock não tem colunas de banco de verdade — deriva playerSlots direto de members,
      // mesma ideia (só) das colunas rígidas player1_*..player8_* que o HttpSplitLogRepository
      // popula de verdade (migration 20260822000000).
      playerSlots: dto.members.slice(0, 8).map((m) => ({ name: m.name, damage: m.damage, healing: m.healing })),
      ...dto,
    };
    const list = store.get(accountId) ?? [];
    list.push(created);
    store.set(accountId, list);
    return created;
  }

  async findByAccount(accountId: string): Promise<SplitLog[]> {
    await delay();
    const list = store.get(accountId) ?? [];
    return list.filter((log) => !hiddenKeys.has(keyOf(accountId, log.date, log.type)));
  }

  async hide(accountId: string, date: string, type: SplitLogType): Promise<void> {
    await delay();
    hiddenKeys.add(keyOf(accountId, date, type));
  }
}
