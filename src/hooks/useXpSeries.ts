import { useEffect, useState } from 'react';
import type { XpCharacterStats } from '@/types';
import { repositories } from '@/services/repositories';

export type { XpCharacterStats, XpDailyEntry } from '@/types';

/**
 * Devolve o histórico completo de XP por personagem (chave = nome atual), lido da tabela
 * member_xp_snapshots — preenchida todo dia pelo cron api/cron/xp-collect (antes vinha da
 * planilha Google Sheets do usuário). Usado pelo Dashboard, Histórico de XP e modal do
 * Calendário (busca um dia específico, que pode estar fora dos últimos 30 dias).
 */
export function useXpSeries(accountId: string) {
  const [data, setData] = useState<Record<string, XpCharacterStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    repositories.memberXpSnapshot
      .getSeries(accountId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar histórico de XP');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [accountId]);

  return { data, loading, error };
}
