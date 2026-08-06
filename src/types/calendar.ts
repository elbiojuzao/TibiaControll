import type { Hunt } from './hunt';
import type { LootDrop } from './loot-drop';

/** Tudo que aconteceu num dia específico (data no formato DD/MM/YYYY) */
export interface DayActivity {
  date: string;
  hunts: Hunt[];
  drops: LootDrop[];
}
