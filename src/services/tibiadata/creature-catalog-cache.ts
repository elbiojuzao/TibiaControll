import { fetchCreatureCatalog } from './tibiadata-client';
import type { CreatureCatalogEntry } from './tibiadata-client';
import { fetchWithTtlCache } from '@/services/common/ttl-cache';

const STORAGE_KEY = 'tibia-pts:creature-catalog-cache-v1';

/** Catálogo de ~718 criaturas muda raríssimo (só quando a CipSoft lança conteúdo novo) —
 * mesmo TTL folgado de world-list-cache.ts (7 dias) em vez de reconsultar toda vez que a
 * tela de Configurações ou a topbar precisam resolver um ícone. */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function fetchCreatureCatalogCached(): Promise<CreatureCatalogEntry[]> {
  return fetchWithTtlCache(STORAGE_KEY, fetchCreatureCatalog, TTL_MS);
}
