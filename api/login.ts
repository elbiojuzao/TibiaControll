import { loginWithPassword, LOGIN_RATE_LIMIT_WINDOW_MS, LOGIN_RATE_LIMIT_MAX_ATTEMPTS } from './_lib/login.js';
import { checkRateLimit, clientKeyFromRequest } from './_lib/rate-limit.js';

/** Vercel Node Function — POST /api/login. Tipado à mão (sem @vercel/node);
 * req.body já vem parseado pelo runtime Node do Vercel quando o
 * Content-Type é application/json (sem precisar de nenhum middleware extra). */
export default async function handler(
  req: {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
    body?: { email?: string; password?: string };
  },
  res: {
    status: (code: number) => typeof res;
    json: (body: unknown) => void;
    setHeader: (name: string, value: string) => void;
  },
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rateLimit = checkRateLimit(`login:${clientKeyFromRequest(req)}`, { windowMs: LOGIN_RATE_LIMIT_WINDOW_MS, maxRequests: LOGIN_RATE_LIMIT_MAX_ATTEMPTS });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds ?? 60));
    res.status(429).json({ error: 'Muitas tentativas de login. Aguarde alguns minutos e tente de novo.' });
    return;
  }

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Informe e-mail e senha.' });
    return;
  }

  try {
    const session = await loginWithPassword(email, password);
    res.status(200).json(session);
  } catch (err) {
    res.status(401).json({ error: err instanceof Error ? err.message : 'Falha ao entrar.' });
  }
}
