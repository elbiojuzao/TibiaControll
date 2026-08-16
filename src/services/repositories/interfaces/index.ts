import type { Account } from '@/types';

/** Login de verdade agora é Supabase Auth (ver useAuth/RequireAuth) — este repositório só
 * resolve qual é o workspace/party atual, não autentica ninguém. */
export interface IAccountRepository {
  getCurrentAccount(): Promise<Account | null>;
  updatePartyName(accountId: string, partyName: string): Promise<Account>;
}

export interface IMemberRepository {
  findByAccount(accountId: string): Promise<import('@/types').Member[]>;
  create(accountId: string, dto: import('@/types').CreateMemberDto): Promise<import('@/types').Member>;
  update(id: string, dto: Partial<import('@/types').CreateMemberDto>): Promise<import('@/types').Member>;
  delete(id: string): Promise<void>;
}

export interface ILootDropRepository {
  findByAccount(accountId: string, filters?: import('@/types').LootDropFilters): Promise<import('@/types').LootDrop[]>;
  findById(id: string): Promise<import('@/types').LootDrop | null>;
  create(accountId: string, dto: import('@/types').CreateLootDropDto): Promise<import('@/types').LootDrop>;
  update(id: string, dto: Partial<import('@/types').CreateLootDropDto>): Promise<import('@/types').LootDrop>;
  delete(id: string): Promise<void>;
}

export interface IHuntRepository {
  findByAccount(accountId: string): Promise<import('@/types').Hunt[]>;
  findByDate(accountId: string, date: string): Promise<import('@/types').Hunt[]>;
  create(accountId: string, dto: import('@/types').CreateHuntDto): Promise<import('@/types').Hunt>;
  getSummary(accountId: string, period: import('@/types').HuntSummary['period']): Promise<import('@/types').HuntSummary>;
}

export interface IBossRepository {
  findAll(): Promise<import('@/types').BossMechanic[]>;
  findById(id: string): Promise<import('@/types').BossMechanic | null>;
}

export interface ISplitRepository {
  saveSplit(huntId: string, splits: import('@/types').IndividualSplit[]): Promise<void>;
  findByHunt(huntId: string): Promise<import('@/types').IndividualSplit[]>;
}

export interface IServiceiroRepository {
  findByAccount(accountId: string): Promise<import('@/types').Serviceiro[]>;
  create(accountId: string, dto: import('@/types').CreateServiceiroDto): Promise<import('@/types').Serviceiro>;
  update(id: string, dto: Partial<import('@/types').CreateServiceiroDto>): Promise<import('@/types').Serviceiro>;
  delete(id: string): Promise<void>;
}

export interface IDashboardRepository {
  getMemberXpStats(accountId: string): Promise<Record<string, import('@/types').MemberXpStats>>;
}

export interface ISettingsRepository {
  getSettings(accountId: string): Promise<import('@/types').PartySettings>;
}
