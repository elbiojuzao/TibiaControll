import { useEffect, useState } from 'react';

export interface BossHuntDailyEntry {
  /** DD/MM/YYYY */
  date: string;
  /** profit/ind hunt — já dividido por 4 (ver memória "integracao-planilha-xp") */
  hunt: number;
  /** profit/ind Boss — já dividido por 5 */
  boss: number;
}

/**
 * Busca /api/boss-hunt-sheet uma vez e devolve o histórico completo de profit
 * individual de Hunt/Boss por dia, lido ao vivo da aba "Boss hunt" da planilha do
 * usuário. Usado no modal de dia do Calendário e nos KPIs de Hunt/Boss do Dashboard.
 */
export function useBossHuntSheet() {
  const [series, setSeries] = useState<BossHuntDailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/boss-hunt-sheet')
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setSeries(json.series ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar Boss/Hunt da planilha');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { series, loading, error };
}
