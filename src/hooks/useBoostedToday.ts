import { useEffect, useState } from 'react';
import { fetchBoostedCreature, fetchBoostedBoss } from '@/services/tibiadata/tibiadata-client';
import type { BoostedEntry } from '@/services/tibiadata/tibiadata-client';

export function useBoostedToday() {
  const [creature, setCreature] = useState<BoostedEntry | null>(null);
  const [boss, setBoss] = useState<BoostedEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [creatureResult, bossResult] = await Promise.all([fetchBoostedCreature(), fetchBoostedBoss()]);
        if (!cancelled) {
          setCreature(creatureResult);
          setBoss(bossResult);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao buscar dados do TibiaData');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { creature, boss, loading, error };
}
