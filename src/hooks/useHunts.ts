import { useEffect, useState } from 'react';
import type { Hunt } from '@/types';
import { repositories } from '@/services/repositories';

export function useHunts(accountId: string) {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await repositories.hunt.findByAccount(accountId);
        if (!cancelled) setHunts(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar hunts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [accountId]);

  return { hunts, loading, error };
}
