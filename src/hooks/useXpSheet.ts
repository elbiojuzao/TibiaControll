import { useEffect, useState } from 'react';

export interface XpDailyEntry {
  /** DD/MM/YYYY */
  date: string;
  value: number;
}

export interface XpCharacterStats {
  xpOntem: number;
  xp30Dias: number;
  series: XpDailyEntry[];
}

/**
 * Busca /api/xp-sheet uma vez e devolve o histórico completo de XP por personagem,
 * lido ao vivo da planilha do usuário (ver memória "integracao-planilha-xp"). Usado
 * tanto pelo Histórico de XP (últimos 30 dias) quanto pelo modal do Calendário
 * (busca um dia específico, que pode estar fora dos últimos 30 dias).
 */
export function useXpSheet() {
  const [data, setData] = useState<Record<string, XpCharacterStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/xp-sheet')
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
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
