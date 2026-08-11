import type { XpCharacterStats } from '@/types';

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

interface CacheEnvelope {
  fetchedAt: number;
  data: Record<string, XpCharacterStats>;
}

function todaysRefreshBoundary(reference: Date): number {
  const boundary = new Date(reference);
  boundary.setHours(REFRESH_HOUR, REFRESH_MINUTE, 0, 0);
  if (reference.getTime() < boundary.getTime()) {
    boundary.setDate(boundary.getDate() - 1);
  }
  return boundary.getTime();
}

function readCache(): CacheEnvelope | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEnvelope;
  } catch {
    return null;
  }
}

function writeCache(data: Record<string, XpCharacterStats>): void {
  try {
    const envelope: CacheEnvelope = { fetchedAt: Date.now(), data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // localStorage indisponível (aba anônima, quota cheia etc.) — segue sem cache.
  }
}

let inFlight: Promise<Record<string, XpCharacterStats>> | null = null;

/**
 * Busca a XP da planilha (via /api/xp-sheet), mas no máximo 1 vez por dia — reaproveita
 * o localStorage até a próxima janela das 7h15 (ver REFRESH_HOUR/REFRESH_MINUTE acima).
 * Compartilhado entre useXpSheet e MockDashboardRepository.getMemberXpStats pra não
 * duplicar a chamada nem a lógica de cache.
 */
export function fetchXpSheetCached(): Promise<Record<string, XpCharacterStats>> {
  const cached = readCache();
  const boundary = todaysRefreshBoundary(new Date());
  if (cached && cached.fetchedAt >= boundary) {
    return Promise.resolve(cached.data);
  }

  if (inFlight) return inFlight;

  inFlight = fetch('/api/xp-sheet', { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error(`status ${res.status}`);
      return res.json() as Promise<Record<string, XpCharacterStats>>;
    })
    .then((data) => {
      writeCache(data);
      return data;
    })
    .catch((err) => {
      // Planilha indisponível agora — se tem cache velho, é melhor que nada.
      if (cached) return cached.data;
      throw err;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
