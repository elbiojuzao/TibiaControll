import type { XpCharacterStats } from '@/types';
import { fetchWithDailyCache } from '@/services/common/daily-cache';

// v2 (2026-08-10): bump proposital — v1 não tinha xp90Dias no payload cacheado, e como o
// cache só expira na próxima janela das 7h15, quem já tinha um cache v1 gravado ficaria com
// "Previsão fim de ano" mostrando "—" por até um dia inteiro sem essa troca de chave.
const STORAGE_KEY = 'tibia-pts:xp-sheet-cache-v2';

/**
 * A rotina automática do usuário grava a XP do dia na planilha entre 6h e 7h da manhã.
 * Um cache "de hoje" só é confiável a partir das 7h15 — antes disso (ou se nunca buscou
 * nesse intervalo ainda), força uma busca nova mesmo que já tenha rodado "hoje" antes das 6h.
 */
const REFRESH_HOUR = 7;
const REFRESH_MINUTE = 15;

/**
 * Busca a XP da planilha (via /api/xp-sheet), mas no máximo 1 vez por dia — reaproveita
 * o localStorage até a próxima janela das 7h15 (ver REFRESH_HOUR/REFRESH_MINUTE acima).
 * Compartilhado entre useXpSheet e MockDashboardRepository.getMemberXpStats pra não
 * duplicar a chamada nem a lógica de cache.
 */
export function fetchXpSheetCached(): Promise<Record<string, XpCharacterStats>> {
  return fetchWithDailyCache(
    STORAGE_KEY,
    async () => {
      const res = await fetch('/api/xp-sheet', { cache: 'no-store' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      return res.json() as Promise<Record<string, XpCharacterStats>>;
    },
    REFRESH_HOUR,
    REFRESH_MINUTE,
  );
}
