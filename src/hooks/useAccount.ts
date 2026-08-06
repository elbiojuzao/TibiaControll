import { useEffect, useState } from 'react';
import type { Account } from '@/types';
import { repositories } from '@/services/repositories';
import { MOCK_ACCOUNT_ID } from '@/mocks/data/accounts';

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let current = await repositories.account.getCurrentAccount();
        if (!current) {
          await repositories.account.login({ username: 'demo@pt.com', password: 'demo123' });
          current = await repositories.account.getCurrentAccount();
        }
        if (!cancelled) setAccount(current);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { account, loading, accountId: account?.id ?? MOCK_ACCOUNT_ID };
}
