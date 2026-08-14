import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';

/**
 * Login real via Supabase Auth — 1 única credencial compartilhada pela PT inteira (login
 * de party compartilhado, não por pessoa — ver memória de projeto "regras-gestao-pts").
 * O usuário (conta de verdade) precisa ser criado manualmente no dashboard do Supabase
 * (Authentication → Users → Add user, com "Auto Confirm User" marcado) — não crio contas
 * por aqui, nenhuma credencial de administração foi compartilhada nessa sessão.
 */
export async function signInWithPassword(email: string, password: string): Promise<Session> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Login falhou — sessão não retornada.');
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession(): Promise<Session | null> {
  const { data } = await getSupabaseClient().auth.getSession();
  return data.session;
}

/** Retorna a função de unsubscribe — chamar no cleanup do useEffect que registrar isso. */
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
