import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';
import { friendlyErrorMessage } from '@/services/common/friendly-supabase-error';

/** Erro de `/api/login` com o status HTTP junto — LoginPage.tsx usa isso pra decidir se
 * mostra a mensagem tal como veio (ex: "Muitas tentativas...", 429) ou troca por um
 * "E-mail ou senha inválidos." genérico (401 — credencial errada não deveria confirmar/
 * negar detalhe nenhum da conta pro usuário). */
export class LoginRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'LoginRequestError';
    this.status = status;
  }
}

/**
 * Login real via Supabase Auth — 1 única credencial compartilhada pela PT inteira (login
 * de party compartilhado, não por pessoa — ver memória de projeto "regras-gestao-pts").
 * O usuário (conta de verdade) precisa ser criado manualmente no dashboard do Supabase
 * (Authentication → Users → Add user, com "Auto Confirm User" marcado) — não crio contas
 * por aqui, nenhuma credencial de administração foi compartilhada nessa sessão.
 *
 * **Proteção contra força bruta (2026-09-30, pedido do usuário)** — em vez de chamar
 * `auth.signInWithPassword()` do SDK direto do browser (sem nenhum limite nosso), a
 * tentativa passa primeiro por `/api/login` (Vercel Function em produção, plugin de dev do
 * Vite em `npm run dev` — ver api/_lib/login.ts), que aplica um limite de 5 tentativas a
 * cada 15min por IP antes de sequer bater no Supabase. Depois que o proxy confirma as
 * credenciais, `auth.setSession()` hidrata a sessão real no SDK (mesmo storage/refresh
 * automático/`onAuthStateChange` de sempre) — o resto do app (useAuth, RequireAuth) não
 * precisou mudar nada, `signInWithPassword` continua devolvendo um `Session` normal.
 */
export async function signInWithPassword(email: string, password: string): Promise<Session> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new LoginRequestError(body.error ?? 'Falha ao entrar.', res.status);

  const { error: setSessionError } = await getSupabaseClient().auth.setSession({
    access_token: body.accessToken,
    refresh_token: body.refreshToken,
  });
  if (setSessionError) throw new Error(friendlyErrorMessage(setSessionError));

  const { data } = await getSupabaseClient().auth.getSession();
  if (!data.session) throw new Error('Login falhou — sessão não retornada.');
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw new Error(friendlyErrorMessage(error));
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

/** Configurações da conta (2026-08-25, pedido do usuário: "ajustar as configurações das
 * contas, senha email configuração confirmaçao de email"). Trocar senha/e-mail do login
 * compartilhado da PT — afeta TODO MUNDO que loga com essa credencial, não só quem está
 * trocando (mesmo padrão de "Nome da Party"). */
export interface AccountEmailInfo {
  email: string;
  /** null = e-mail atual ainda não confirmado (raro — contas são criadas com "Auto Confirm
   * User" marcado, ver signInWithPassword acima). */
  emailConfirmedAt: string | null;
  /** Preenchido quando existe uma troca de e-mail PENDENTE (usuário trocou mas ainda não
   * clicou no link de confirmação enviado pro endereço novo). */
  pendingNewEmail: string | null;
}

async function getCurrentUserEmail(): Promise<string> {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw new Error(friendlyErrorMessage(error));
  if (!data.user?.email) throw new Error('Não foi possível identificar o e-mail da conta logada.');
  return data.user.email;
}

export async function getAccountEmailInfo(): Promise<AccountEmailInfo> {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw new Error(friendlyErrorMessage(error));
  if (!data.user) throw new Error('Sessão inválida.');
  return {
    email: data.user.email ?? '',
    emailConfirmedAt: data.user.email_confirmed_at ?? null,
    pendingNewEmail: data.user.new_email ?? null,
  };
}

/** Reverifica a senha atual antes de trocar senha/e-mail — camada extra de confirmação
 * pedida pelo usuário (a API do Supabase, sozinha, não exige a senha atual pra
 * `updateUser()`, confia só na sessão já ativa). Reautentica de verdade via
 * `signInWithPassword` — se a senha estiver errada, o próprio Supabase rejeita. */
async function verifyCurrentPassword(currentPassword: string): Promise<void> {
  const email = await getCurrentUserEmail();
  const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password: currentPassword });
  if (error) throw new Error('Senha atual incorreta.');
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await verifyCurrentPassword(currentPassword);
  const { error } = await getSupabaseClient().auth.updateUser({ password: newPassword });
  if (error) throw new Error(friendlyErrorMessage(error));
}

/** Troca de e-mail — o Supabase envia um link de confirmação pro endereço NOVO (e, por
 * padrão do projeto — "Secure email change" — também um aviso pro endereço ANTIGO). O
 * e-mail só muda de verdade depois que o link é clicado; até lá `pendingNewEmail` (ver
 * getAccountEmailInfo) fica preenchido. Nunca inventa confirmação — é 100% o fluxo padrão
 * do Supabase Auth. */
export async function changeEmail(currentPassword: string, newEmail: string): Promise<void> {
  await verifyCurrentPassword(currentPassword);
  const { error } = await getSupabaseClient().auth.updateUser({ email: newEmail });
  if (error) throw new Error(friendlyErrorMessage(error));
}
