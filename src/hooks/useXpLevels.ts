import { useEffect, useState } from 'react';
import { fetchXpLevels } from '@/services/supabase/xp-levels-client';

/** Tabela de referência de XP por nível (50 em 50, até 4000) — usada pra calcular a Meta
 * XP Diária no Dashboard. Dado universal do jogo, igual pra qualquer conta — busca 1x. */
export function useXpLevels() {
  const [levels, setLevels] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchXpLevels()
      .then((data) => {
        if (!cancelled) setLevels(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar tabela de níveis');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { levels, loading, error };
}
