import { fetchBoostedCreature, fetchBoostedBoss } from './tibiadata-client';
import type { BoostedEntry } from './tibiadata-client';
import { fetchWithDailyCache } from '@/services/common/daily-cache';

const STORAGE_KEY = 'tibia-pts:boosted-today-cache-v1';

/** O Tibia troca a criatura/boss bostados só 1x por dia, por volta das 5h-6h da manhã
 * (reset diário do jogo) — nunca repete no dia seguinte. Cache local evita bater na API do
 * TibiaData de novo em toda navegação/reload durante o mesmo dia (pedido do usuário em
 * 2026-08-14: "vamos usar o localstore... se já tiver sido atualizado no dia não atualiza
 * mais até o próximo"). */
const REFRESH_HOUR = 6;

export interface BoostedTodayData {
  creature: BoostedEntry;
  boss: BoostedEntry;
}

export function fetchBoostedTodayCached(): Promise<BoostedTodayData> {
  return fetchWithDailyCache(
    STORAGE_KEY,
    async () => {
      const [creature, boss] = await Promise.all([fetchBoostedCreature(), fetchBoostedBoss()]);
      return { creature, boss };
    },
    REFRESH_HOUR,
  );
}
