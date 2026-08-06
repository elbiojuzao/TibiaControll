import { useEffect, useState } from 'react';
import type { PartySettings } from '@/types';
import { repositories } from '@/services/repositories';

export function usePartySettings(accountId: string) {
  const [settings, setSettings] = useState<PartySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    repositories.settings.getSettings(accountId).then((data) => {
      if (!cancelled) {
        setSettings(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [accountId]);

  return { settings, loading };
}
