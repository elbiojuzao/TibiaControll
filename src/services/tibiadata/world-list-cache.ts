import { fetchWorldNames } from './tibiadata-client';
import { fetchWithTtlCache } from '@/services/common/ttl-cache';

const STORAGE_KEY = 'tibia-pts:world-list-cache-v1';

/** Lista de mundos do Tibia muda raríssimo (só quando a CipSoft abre/fecha um mundo) —
 * TTL bem folgado (7 dias) em vez de cache diário, pra não bater na API toda vez que
 * Configurações é aberta, sem precisar de uma janela de horário fixo pra isso. */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function fetchWorldNamesCached(): Promise<string[]> {
  return fetchWithTtlCache(STORAGE_KEY, fetchWorldNames, TTL_MS);
}
