/**
 * Núcleo comum de cache local (localStorage) — dedupe de requisições concorrentes por
 * chave e fallback pro cache velho se o fetch falhar. `isValid(fetchedAt)` decide se o
 * cache ainda vale; os dois casos de uso concretos ficam em módulos separados:
 *   - daily-cache.ts: expira numa janela fixa do relógio (ex: "6h da manhã").
 *   - ttl-cache.ts: expira depois de um tempo fixo desde a última busca (ex: "1 hora").
 * Extraído em 2026-08-14 pra não duplicar essa lógica entre os dois.
 */
interface CacheEnvelope<T> {
  fetchedAt: number;
  data: T;
}

const inFlightByKey = new Map<string, Promise<unknown>>();

function readCacheEnvelope<T>(storageKey: string): CacheEnvelope<T> | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

function writeCacheEnvelope<T>(storageKey: string, data: T): void {
  try {
    const envelope: CacheEnvelope<T> = { fetchedAt: Date.now(), data };
    localStorage.setItem(storageKey, JSON.stringify(envelope));
  } catch {
    // localStorage indisponível (aba anônima, quota cheia etc.) — segue sem cache.
  }
}

export function fetchWithLocalCache<T>(
  storageKey: string,
  fetcher: () => Promise<T>,
  isValid: (fetchedAt: number) => boolean,
): Promise<T> {
  const cached = readCacheEnvelope<T>(storageKey);
  if (cached && isValid(cached.fetchedAt)) {
    return Promise.resolve(cached.data);
  }

  const existing = inFlightByKey.get(storageKey) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fetcher()
    .then((data) => {
      writeCacheEnvelope(storageKey, data);
      return data;
    })
    .catch((err) => {
      if (cached) return cached.data;
      throw err;
    })
    .finally(() => {
      inFlightByKey.delete(storageKey);
    });

  inFlightByKey.set(storageKey, promise);
  return promise;
}
