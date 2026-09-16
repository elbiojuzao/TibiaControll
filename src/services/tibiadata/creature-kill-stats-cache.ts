import { fetchCreatureKillStats } from './tibiadata-client';
import type { CreatureKillStats } from './tibiadata-client';
import { fetchWithDailyCache } from '@/services/common/daily-cache';

/** Kill statistics do TibiaData são recalculadas 1x por dia, na mesma janela do reset
 * diário do jogo (mesmo horário do boosted creature/boss, ver boosted-cache.ts) — cache
 * evita bater na API de novo em toda navegação/reload durante o mesmo dia. */
const REFRESH_HOUR = 6;

/** Uma chave de cache por mundo+criatura — times diferentes (ou trocar a criatura
 * monitorada no futuro) não colidem no mesmo storageKey. */
export function fetchCreatureKillStatsCached(world: string, creatureName: string): Promise<CreatureKillStats | null> {
  const storageKey = `tibia-pts:kill-stats-cache-v1:${world.toLowerCase()}:${creatureName.toLowerCase()}`;
  return fetchWithDailyCache(storageKey, () => fetchCreatureKillStats(world, creatureName), REFRESH_HOUR);
}
