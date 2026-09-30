/**
 * Proxy server-side pro login (2026-09-30, pedido do usuário: "camada de proteção nas
 * requisições de login") — antes disso `signInWithPassword` batia DIRETO na API do
 * Supabase Auth a partir do browser (services/supabase/supabase-auth.ts), sem nenhum
 * limite de tentativas nosso: um script trocando senha após senha na tela de login não
 * esbarrava em nada além do rate limit genérico (e não documentado publicamente) do
 * próprio Supabase. Agora o login passa por aqui primeiro — `checkRateLimit` (por IP,
 * janela própria e bem mais curta que a de requisições normais, ver api/login.ts/
 * vite.config.ts) bloqueia antes mesmo da tentativa chegar no Supabase.
 *
 * `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` já são lidas aqui via `process.env`
 * (mesmas variáveis que o client usa via `import.meta.env` — o prefixo VITE_ só controla
 * se o Vite injeta no bundle do browser, não restringe leitura server-side; precisam estar
 * configuradas no Vercel/.env.local do mesmo jeito que já estão pro client funcionar).
 */
/** 5 tentativas a cada 15 minutos por IP — bem mais apertado que o limite genérico de
 * requisições (20/min em rate-limit.ts), de propósito: aqui é login, não uma leitura
 * pública. Exportadas daqui (não de api/login.ts) pra api/login.ts E o plugin de dev do
 * Vite usarem o MESMO valor sem duplicar/desalinhar. */
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60_000;
export const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;

export interface LoginSession {
  accessToken: string;
  refreshToken: string;
}

interface GoTrueTokenResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
  msg?: string;
  error_code?: string;
}

export async function loginWithPassword(email: string, password: string): Promise<LoginSession> {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) throw new Error('Supabase não configurado no servidor.');

  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as GoTrueTokenResponse;

  // O shape do erro do GoTrue já mudou de versão pra versão (`error_description` nas mais
  // antigas, `msg`/`error_code` nas atuais) — tenta os três antes de cair num texto genérico,
  // nunca vazando o corpo cru da resposta pro usuário.
  if (!res.ok || !data.access_token || !data.refresh_token) {
    throw new Error(data.error_description || data.msg || data.error || 'Credenciais inválidas.');
  }

  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}
