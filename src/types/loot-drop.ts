import type { Vocation } from './account';

/** Composicao da party no momento do drop (colunas EK, ED, MS, RP, 5o, Service) */
export interface PartyComposition {
  ek?: string;
  ed?: string;
  ms?: string;
  rp?: string;
  fifthPlayer?: string;
  /** Texto legado (nome do char servido) — mantido por compat com drops mock antigos */
  service?: string;
  /** Referência ao Serviceiro (src/types/serviceiro.ts) que cobriu uma vaga nessa hunt */
  serviceiroId?: string;
  /** "Service em": qual vocação/vaga o serviceiro cobriu */
  serviceiroVocation?: Vocation;
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
