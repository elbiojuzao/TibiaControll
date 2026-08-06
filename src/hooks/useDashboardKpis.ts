import { useEffect, useState } from 'react';
import type { DashboardKpis } from '@/types';
import { repositories } from '@/services/repositories';

export function useDashboardKpis(accountId: string) {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    repositories.dashboard.getKpis(accountId).then((data) => {
      if (!cancelled) {
        setKpis(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [accountId]);

  return { kpis, loading };
}
