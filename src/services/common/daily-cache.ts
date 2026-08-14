import { fetchWithLocalCache } from './local-cache';

/**
 * Cache local pra dado que só muda numa janela fixa do dia (ex: boosted creature/boss do
 * TibiaData, atualizados ~6h da manhã; planilha de XP do usuário, atualizada entre 6h-7h).
 * Busca de novo no máximo 1x por dia, reaproveitando o valor cacheado até a próxima janela
 * de atualização — ver local-cache.ts pro núcleo (dedupe/fallback) e ttl-cache.ts pro caso
 * "expira depois de X tempo" em vez de "expira num horário fixo".
 */
function todaysRefreshBoundary(reference: Date, refreshHour: number, refreshMinute: number): number {
  const boundary = new Date(reference);
  boundary.setHours(refreshHour, refreshMinute, 0, 0);
  if (reference.getTime() < boundary.getTime()) {
    boundary.setDate(boundary.getDate() - 1);
  }
  return boundary.getTime();
}

/**
 * Busca `fetcher()` no máximo 1x por dia, reaproveitando o cache local até a próxima janela
 * de atualização (refreshHour:refreshMinute, horário local do navegador). Se o fetch falhar
 * mas existir cache velho, devolve o cache velho em vez de quebrar a tela. `storageKey` deve
 * incluir uma versão (ex: '...-v1') — bumpar sempre que o shape de `T` mudar, senão quem já
 * tem cache salvo fica preso no payload antigo até a próxima janela (até 1 dia inteiro).
 */
export function fetchWithDailyCache<T>(
  storageKey: string,
  fetcher: () => Promise<T>,
  refreshHour: number,
  refreshMinute = 0,
): Promise<T> {
  const boundary = todaysRefreshBoundary(new Date(), refreshHour, refreshMinute);
  return fetchWithLocalCache(storageKey, fetcher, (fetchedAt) => fetchedAt >= boundary);
}
