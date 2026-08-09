import { useEffect, useState } from 'react';
import type { XpCharacterStats } from '@/types';
import { fetchXpSheetCached } from '@/services/xp-sheet/xp-sheet-cache';

export type { XpCharacterStats, XpDailyEntry } from '@/types';

/**
 * Devolve o histórico completo de XP por personagem, lido da planilha do usuário (ver
 * memória "integracao-planilha-xp"). Usado tanto pelo Histórico de XP (últimos 30 dias)
 * quanto pelo modal do Calendário (busca um dia específico, que pode estar fora dos
 * últimos 30 dias). A busca em si é cacheada localmente 1x/dia — ver xp-sheet-cache.ts.
 */
export function useXpSheet() {
  const [data, setData] = useState<Record<string, XpCharacterStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchXpSheetCached()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar XP da planilha');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
