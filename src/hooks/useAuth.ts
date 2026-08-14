import { useEffect, useState } from 'react';
import { getSession, onAuthStateChange, signInWithPassword, signOut } from '@/services/supabase/supabase-auth';

/**
 * Sessão real do Supabase Auth — gate de login pros 5 módulos exclusivos de conta
 * (Dashboard, Log de Drops, Histórico, Histórico de XP, Serviceiros). Separado de
 * useAccount() de propósito: useAuth() responde "a pessoa pode entrar?" (sessão válida),
 * useAccount() responde "qual é o workspace/party" (ainda mock, não mudou aqui).
 */
export function useAuth() {
  const [isLoading, setLoading] = useState(true);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSession().then((session) => {
      if (!cancelled) {
        setAuthenticated(!!session);
        setLoading(false);
      }
    });

    const unsubscribe = onAuthStateChange((session) => {
      if (!cancelled) setAuthenticated(!!session);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithPassword(email, password);
      // onAuthStateChange já atualiza isAuthenticated — não precisa setar aqui.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entrar.');
      throw err;
    }
  };

  const logout = () => signOut();

  return { isLoading, isAuthenticated, error, login, logout };
}
