import { useEffect, useState } from 'react';
import type { Account } from '@/types';
import { repositories } from '@/services/repositories';
import { MOCK_ACCOUNT_ID } from '@/mocks/data/accounts';
import { readCachedAccount, writeCachedAccount, onAccountCacheUpdate } from '@/services/account/account-cache';
import { useAuth } from './useAuth';

/** Já buscamos a conta do Supabase nesta sessão de navegador (reseta a cada reload de
 * página e no logout)? Módulo-level de propósito: `useAccount()` é chamado
 * independentemente em quase toda página (AppLayout, Dashboard, LootLog, Split,
 * Serviceiros, Histórico, Histórico de XP, Configurações) — sem essa flag compartilhada
 * entre instâncias, CADA remontagem ao navegar dispararia uma query nova pro Supabase só
 * pra buscar um dado que quase nunca muda (nome da party). Pedido explícito do usuário
 * em 2026-08-16: "usar o localstore para não ter que fazer requisição o tempo todo pois
 * é algo frivolo... atualizado apenas quando o usuario troca o nome da pt ou quando loga". */
let hasFetchedFreshThisSession = false;

/** Resolve o workspace/party do usuário logado. Espera useAuth() terminar de checar a
 * sessão antes de consultar — evita o caso de disparar a query antes da sessão do
 * Supabase estar restaurada (o que faria a conta vir vazia mesmo com login válido).
 *
 * Só bate no banco (a) na primeira vez que autentica nesta aba/sessão (login, ou reload
 * de página já autenticado) ou (b) quando não há cache nenhum ainda. Fora isso, lê do
 * cache local — navegar entre páginas (cada uma remontando seu próprio useAccount()) não
 * dispara requisição nova. `updatePartyName()` grava o valor novo direto no cache, também
 * sem precisar buscar de novo. */
export function useAccount() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [account, setAccount] = useState<Account | null>(() => readCachedAccount());
  const [loading, setLoading] = useState(!readCachedAccount());

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      hasFetchedFreshThisSession = false; // próximo login busca de novo, garante dado fresco
      return;
    }

    const cached = readCachedAccount();
    if (cached && hasFetchedFreshThisSession) {
      setAccount(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    repositories.account.getCurrentAccount().then((current) => {
      if (!cancelled) {
        setAccount(current);
        setLoading(false);
        hasFetchedFreshThisSession = true;
        if (current) writeCachedAccount(current);
      }
    });

    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated]);

  // Sincroniza instantaneamente com outras instâncias do hook montadas na mesma aba —
  // ex: editar o nome da party em Configurações precisa refletir na topbar (AppLayout)
  // sem precisar de reload.
  useEffect(() => onAccountCacheUpdate(setAccount), []);

  const updatePartyName = async (partyName: string): Promise<Account> => {
    if (!account) throw new Error('Conta não carregada ainda.');
    const updated = await repositories.account.updatePartyName(account.id, partyName);
    setAccount(updated);
    writeCachedAccount(updated);
    return updated;
  };

  return { account, loading, accountId: account?.id ?? MOCK_ACCOUNT_ID, updatePartyName };
}
