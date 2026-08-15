import { useEffect, useState } from 'react';
import { fetchBossQuests, type BossQuestsData } from '@/services/supabase/boss-quests-client';

const EMPTY: BossQuestsData = { bosses: [], bossToQuest: {}, quests: [] };

/** Lista de bosses individuais agrupados por quest (tabela real, ver
 * services/supabase/boss-quests-client.ts) — usada pro filtro de quest no formulário
 * de drop. Dado universal do jogo, igual pra qualquer conta — busca 1x. */
export function useBossQuests() {
  const [data, setData] = useState<BossQuestsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBossQuests()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar bosses');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { ...data, loading, error };
}
