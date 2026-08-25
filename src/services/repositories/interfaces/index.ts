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

/** Splits salvos da Calculadora de Split Loot (2026-08-19) — não confundir com o
 * ISplitRepository acima (IndividualSplit/huntId), scaffolding antiga do planejamento
 * original que nunca foi ligada a nenhuma tela real. */
export interface ISplitLogRepository {
  create(accountId: string, dto: import('@/types').CreateSplitLogDto): Promise<import('@/types').SplitLog>;
  findByAccount(accountId: string): Promise<import('@/types').SplitLog[]>;
  /** Soft delete — esconde TODOS os splits daquele tipo salvos naquele dia (o dia pode
   * ter mais de um, ver conventions em split_logs). Nunca apaga de verdade. */
  hide(accountId: string, date: string, type: import('@/types').SplitLogType): Promise<void>;
  /** Soft delete de 1 split específico por id (2026-08-23, aba Splits do Histórico —
   * diferente de `hide()` acima, que esconde TODOS os splits daquele tipo/dia; aqui o
   * usuário escolhe exatamente qual split errado excluir, já que pode haver mais de um do
   * mesmo tipo no mesmo dia). Nunca apaga de verdade. */
  hideById(accountId: string, id: string): Promise<void>;
}

/** Eventos cadastrados manualmente pelo usuário pra própria conta/PT (2026-08-25) — não
 * confundir com eventos OFICIAIS do jogo (tabela `tibia_events`, sem account_id, lidos via
 * useTibiaEvents — dado universal do jogo, não da conta). */
export interface IPartyEventRepository {
  create(accountId: string, dto: import('@/types').CreatePartyEventDto): Promise<import('@/types').PartyEvent>;
  findByAccount(accountId: string): Promise<import('@/types').PartyEvent[]>;
}
