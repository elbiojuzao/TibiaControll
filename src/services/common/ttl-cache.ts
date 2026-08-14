import { fetchWithLocalCache } from './local-cache';

/**
 * Cache local pra dado que deve ficar "fresco" por um tempo fixo desde a última busca (TTL
 * rolante), diferente de daily-cache.ts (que expira num horário fixo do relógio). Usado pro
 * Lvl Atual/Skill/XP dos personagens (useMemberLiveStats) — pedido do usuário em 2026-08-14:
 * "usar o localstore de 1 em 1 hora, fazer a requisição e atualizar".
 */
export function fetchWithTtlCache<T>(
  storageKey: string,
  fetcher: () => Promise<T>,
  maxAgeMs: number,
): Promise<T> {
  return fetchWithLocalCache(storageKey, fetcher, (fetchedAt) => Date.now() - fetchedAt < maxAgeMs);
}
