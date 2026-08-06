import { useEffect, useState } from 'react';
import type { Member } from '@/types';
import { repositories } from '@/services/repositories';

export function useMembers(accountId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await repositories.member.findByAccount(accountId);
        if (!cancelled) setMembers(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar membros');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [accountId]);

  return { members, loading, error };
}
