import type { Vocation } from './account';

/** Uma vaga coberta por um Serviceiro numa hunt (drop_services no banco) */
export interface DropService {
  serviceiroId: string;
  /** Nome do serviceiro no momento do registro — usado só pra exibição rápida sem precisar de join no front */
  serviceiroName: string;
  /** Qual vocação/vaga esse serviceiro cobriu — pode faltar em drops históricos importados sem essa info */
  vocation?: Vocation;
}

/** Composicao da party no momento do drop (colunas EK, ED, MS, RP, 5o, Service) */
export interface PartyComposition {
  ek?: string;
  ed?: string;
  ms?: string;
  rp?: string;
  fifthPlayer?: string;
  /** Texto legado (nome do char servido) — mantido só por compat com drops mock antigos */
  service?: string;
  /** Serviceiros que cobriram vagas nessa hunt (0 a N — 1 registro por vaga coberta) */
  services: DropService[];
}

export interface LootDrop {
  id: string;
  accountId: string;
  huntId?: string;
  /** Data do drop (DD/MM/YYYY na UI) */
  date: string;
  party: PartyComposition;
  /** Valor unitario do item (Valor cada) */
  unitValue: number;
  /** Valor total apos taxas/descontos (Valor Total) */
  totalValue: number;
  /** Quem fragou o item (Fragador) */
  looter: string;
  itemName: string;
  itemIconUrl?: string;
  bossName: string;
  sold: boolean;
  saleDate?: string;
}

export interface CreateLootDropDto {
  date: string;
  party: PartyComposition;
  unitValue: number;
  totalValue: number;
  looter: string;
  itemName: string;
  itemIconUrl?: string;
  bossName: string;
  sold?: boolean;
  saleDate?: string;
  huntId?: string;
}

export interface LootDropFilters {
  bossName?: string;
  sold?: boolean;
  dateFrom?: string;
  dateTo?: string;
  looter?: string;
}
