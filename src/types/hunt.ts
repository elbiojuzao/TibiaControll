export interface Hunt {
  id: string;
  accountId: string;
  date: string;
  lootTotal: number;
  wasteTotal: number;
  profitTotal: number;
  xpGained: number;
  bossName?: string;
  notes?: string;
}

export interface CreateHuntDto {
  date: string;
  lootTotal: number;
  wasteTotal: number;
  profitTotal: number;
  xpGained: number;
  bossName?: string;
  notes?: string;
}

export interface HuntSummary {
  period: 'daily' | 'weekly' | 'monthly';
  totalProfit: number;
  totalXp: number;
  huntCount: number;
}
