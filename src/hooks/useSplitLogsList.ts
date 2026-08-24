import { useCallback, useEffect, useState } from 'react';
import { repositories } from '@/services/repositories';
import type { SplitLog } from '@/types';

/** Lista crua de SplitLog (log bruto + membros com damage/healing + transferências) da
 * conta, sem agregação — usada pelo Histórico de Splits (2026-08-21, pedido do usuário:
 * "uma maneira de filtrar os splits por maior dano maior cura separado por player").
 * Independente de useSplitLogsDaily (que agrega só hunt/boss por dia pro Calendário/
 * Dashboard) — hooks separados de propósito, evita acoplar o soft-delete otimista de lá
 * a essa tela nova. */
export function useSplitLogsList(accountId: string) {
  const [splitLogs, setSplitLogs] = useState<SplitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    repositories.splitLog
      .findByAccount(accountId)
      .then((logs) => {
        if (!cancelled) setSplitLogs(logs);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar splits salvos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [accountId]);

  // Excluir 1 split específico (soft delete, 2026-08-23, pedido do usuário: "uma maneira
  // para excluir um split caso o usuario tenha feito errado") — atualiza o estado local
  // direto (sem refetch), mesmo padrão otimista de useSplitLogsDaily.hideDay.
  const hideSplit = useCallback(async (id: string) => {
    await repositories.splitLog.hideById(accountId, id);
    setSplitLogs((prev) => prev.filter((log) => log.id !== id));
  }, [accountId]);

  return { splitLogs, loading, error, hideSplit };
}
