import { useEffect, useState } from 'react';
import type { Account } from '@/types';
import { repositories } from '@/services/repositories';
import { MOCK_ACCOUNT_ID } from '@/mocks/data/accounts';
import { useAuth } from './useAuth';

/** Resolve o workspace/party do usuário logado. Espera useAuth() terminar de checar a
 * sessão antes de consultar — evita o caso de disparar a query antes da sessão do
 * Supabase estar restaurada (o que faria a conta vir vazia mesmo com login válido) — e
 * refaz a consulta sempre que o estado de autenticação mudar (login/logout), pra não
 * ficar mostrando a conta antiga depois de sair. */
export function useAccount() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setLoading(true);

    repositories.account.getCurrentAccount().then((current) => {
      if (!cancelled) {
        setAccount(current);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated]);

  return { account, loading, accountId: account?.id ?? MOCK_ACCOUNT_ID };
}
