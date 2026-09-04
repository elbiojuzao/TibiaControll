import { useCallback, useEffect, useState } from 'react';
import { repositories } from '@/services/repositories';
import type { SplitLogType } from '@/types';

export interface SplitLogDailyEntry {
  /** DD/MM/YYYY */
  date: string;
  /** Soma de cota_por_membro de todos os splits tipo 'hunt' salvos nesse dia — null se
   * nenhum split de Hunt foi salvo nesse dia (distinto de 0, que é lucro genuinamente
   * zerado num dia em que a hunt de fato foi salva). */
  hunt: number | null;
  /** Mesma ideia, tipo 'boss'. */
  boss: number | null;
}

/** Resumo diário de "Cota por Membro" (Hunt/Boss) a partir dos splits salvos em
 * split_logs — usado no Histórico (Calendário), 2026-08-19, pedido do usuário: "no
 * historico (calendario) deve puxar o cota_por_membro do dia em questão tanto do boss
 * quanto do hunt". Substituiu a leitura da planilha Google Sheets (useBossHuntSheet) no
 * Calendário; em 2026-08-20 o Dashboard (KKs Hunt/KKs Boss) migrou pra cá também —
 * useBossHuntSheet/api/boss-hunt-sheet ficaram sem nenhum consumidor e foram removidos.
 * Pode ter mais de um split do mesmo tipo no mesmo dia (cada "Salvar Split" vira uma
 * linha nova, sem sobrescrever) — os valores são somados. */
export function useSplitLogsDaily(accountId: string) {
  const [series, setSeries] = useState<SplitLogDailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    repositories.splitLog
      .findByAccount(accountId)
      .then((logs) => {
        if (cancelled) return;
        const byDate = new Map<string, { hunt: number | null; boss: number | null }>();
        for (const log of logs) {
          const entry = byDate.get(log.date) ?? { hunt: null, boss: null };
          entry[log.type] = (entry[log.type] ?? 0) + log.equalShare;
          byDate.set(log.date, entry);
        }
        setSeries(Array.from(byDate.entries()).map(([date, v]) => ({ date, ...v })));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar splits salvos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [accountId]);

  // Excluir (soft delete, 2026-08-19/20, pedido do usuário) — esconde TODOS os splits
  // daquele tipo salvos naquele dia. Atualiza o estado local direto (sem refetch) pondo o
  // campo desse tipo como null, mesmo padrão otimista já usado em outros hooks do app.
  const hideDay = useCallback(async (date: string, type: SplitLogType) => {
    await repositories.splitLog.hide(accountId, date, type);
    setSeries((prev) => prev.map((entry) => (entry.date === date ? { ...entry, [type]: null } : entry)));
  }, [accountId]);

  // Atualização otimista depois de salvar um split novo pelo "+ Adicionar Split" do modal
  // de dia (2026-09-04, ver QuickAddSplitForm.tsx) — soma `equalShare` ao valor já existente
  // daquele tipo/dia (pode já ter split salvo naquele dia — useSplitLogsDaily soma quando
  // tem mais de um, ver docblock do hook), sem refetch. Se o dia ainda não existia na
  // série, cria uma entrada nova.
  const addSplitOptimistic = useCallback((date: string, type: SplitLogType, equalShare: number) => {
    setSeries((prev) => {
      const existing = prev.find((entry) => entry.date === date);
      if (!existing) {
        return [...prev, { date, hunt: null, boss: null, [type]: equalShare }];
      }
      return prev.map((entry) => (entry.date === date ? { ...entry, [type]: (entry[type] ?? 0) + equalShare } : entry));
    });
  }, []);

  return { series, loading, error, hideDay, addSplitOptimistic };
}
