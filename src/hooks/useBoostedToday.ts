import { useEffect, useState } from 'react';
import { fetchBoostedTodayCached } from '@/services/tibiadata/boosted-cache';
import type { BoostedEntry } from '@/services/tibiadata/tibiadata-client';

export function useBoostedToday() {
  const [creature, setCreature] = useState<BoostedEntry | null>(null);
  const [boss, setBoss] = useState<BoostedEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchBoostedTodayCached()
      .then((data) => {
        if (!cancelled) {
          setCreature(data.creature);
          setBoss(data.boss);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao buscar dados do TibiaData');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { creature, boss, loading, error };
}
