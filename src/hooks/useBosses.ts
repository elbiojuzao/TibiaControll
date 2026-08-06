import { useEffect, useState } from 'react';
import type { BossMechanic } from '@/types';
import { repositories } from '@/services/repositories';

export function useBosses() {
  const [bosses, setBosses] = useState<BossMechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await repositories.boss.findAll();
        if (!cancelled) setBosses(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar bosses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { bosses, loading, error };
}
