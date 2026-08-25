import { useCallback, useEffect, useState } from 'react';
import { getAccountEmailInfo, changePassword, changeEmail, type AccountEmailInfo } from '@/services/supabase/supabase-auth';

/** Trocar senha/e-mail do login compartilhado da PT (2026-08-25, pedido do usuário:
 * "ajustar as configurações das contas, senha email configuração confirmaçao de email").
 * Separado de useAuth() de propósito — useAuth só responde "a pessoa pode entrar?" (gate de
 * rota), este hook é específico da tela de Configurações, ninguém mais precisa buscar
 * `getAccountEmailInfo()` toda vez que a sessão muda. */
export function useAccountSecurity() {
  const [emailInfo, setEmailInfo] = useState<AccountEmailInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEmailInfo(await getAccountEmailInfo());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar informações da conta.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Depois de trocar o e-mail, o Supabase deixa `new_email` pendente até o link de
  // confirmação ser clicado — refetch pra já mostrar "troca pendente" sem esperar reload.
  const handleChangeEmail = useCallback(async (currentPassword: string, newEmail: string) => {
    await changeEmail(currentPassword, newEmail);
    await refresh();
  }, [refresh]);

  return { emailInfo, loading, error, changePassword, changeEmail: handleChangeEmail };
}
