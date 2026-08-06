import { useEffect, useState } from 'react';
import type { MemberXpStats } from '@/types';
import { repositories } from '@/services/repositories';

export function useMemberXpStats(accountId: string) {
  const [statsByName, setStatsByName] = useState<Record<string, MemberXpStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    repositories.dashboard.getMemberXpStats(accountId).then((data) => {
      if (!cancelled) {
        setStatsByName(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [accountId]);

  return { statsByName, loading };
}
