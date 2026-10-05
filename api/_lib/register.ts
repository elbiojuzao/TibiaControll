/**
 * Proxy server-side pro cadastro (2026-10-05) — mesmo motivo do login (ver api/_lib/login.ts):
 * sem isso o browser bateria direto no /auth/v1/signup do Supabase, sem limite nosso, e um
 * script poderia criar contas em massa. A linha em `accounts` NÃO é criada aqui: o trigger
 * `on_auth_user_created` (migration 20261005000000_open_signup.sql) faz isso a partir do
 * `party_name` enviado em `data` (user_metadata).
 */
/** 5 cadastros por hora por IP — mais folgado que o login (um grupo de amigos atrás do mesmo
 * IP pode criar contas em sequência), mas ainda barra criação em massa. */
export const REGISTER_RATE_LIMIT_WINDOW_MS = 60 * 60_000;
export const REGISTER_RATE_LIMIT_MAX_ATTEMPTS = 5;

export const PARTY_NAME_MAX_LENGTH = 40;
export const PASSWORD_MIN_LENGTH = 8;

export interface RegisterResult {
  /** Presente só quando o projeto NÃO exige confirmação de e-mail (sessão já vem no signup). */
  session?: { accessToken: string; refreshToken: string };
  needsEmailConfirmation: boolean;
}

interface GoTrueSignupResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
  msg?: string;
  error_code?: string;
}

function translateSignupError(data: GoTrueSignupResponse): string {
  switch (data.error_code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'Esse e-mail já está cadastrado. Entre com ele ou use outro.';
    case 'weak_password':
      return `Senha fraca demais. Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    case 'email_address_invalid':
    case 'validation_failed':
      return 'E-mail inválido.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Muitos cadastros em pouco tempo. Aguarde alguns minutos e tente de novo.';
    case 'signup_disabled':
      return 'O cadastro está desativado no momento.';
    default:
      return data.msg || data.error_description || data.error || 'Não foi possível criar a conta.';
  }
}

/** Validação feita aqui também (não só no formulário) — este endpoint é público, o front
 * é só uma conveniência. Retorna a mensagem de erro, ou null se estiver tudo certo. */
export function validateRegisterInput(email: unknown, password: unknown, partyName: unknown): string | null {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Informe um e-mail válido.';
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (typeof partyName !== 'string' || partyName.trim().length < 2) return 'Dê um nome pra sua party (mínimo 2 caracteres).';
  if (partyName.trim().length > PARTY_NAME_MAX_LENGTH) return `O nome da party pode ter no máximo ${PARTY_NAME_MAX_LENGTH} caracteres.`;
  return null;
}

export async function registerWithPassword(email: string, password: string, partyName: string): Promise<RegisterResult> {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) throw new Error('Supabase não configurado no servidor.');

  const res = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey },
    body: JSON.stringify({ email: email.trim(), password, data: { party_name: partyName.trim() } }),
  });
  const data = (await res.json()) as GoTrueSignupResponse;
  if (!res.ok) throw new Error(translateSignupError(data));

  if (data.access_token && data.refresh_token) {
    return { session: { accessToken: data.access_token, refreshToken: data.refresh_token }, needsEmailConfirmation: false };
  }
  return { needsEmailConfirmation: true };
}
