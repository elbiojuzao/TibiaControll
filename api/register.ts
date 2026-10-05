import {
  registerWithPassword,
  validateRegisterInput,
  REGISTER_RATE_LIMIT_WINDOW_MS,
  REGISTER_RATE_LIMIT_MAX_ATTEMPTS,
} from './_lib/register.js';
import { checkRateLimit, clientKeyFromRequest } from './_lib/rate-limit.js';

/** Vercel Node Function — POST /api/register. Mesmo formato tipado à mão de api/login.ts. */
export default async function handler(
  req: {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
    body?: { email?: string; password?: string; partyName?: string };
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

  const rateLimit = checkRateLimit(`register:${clientKeyFromRequest(req)}`, {
    windowMs: REGISTER_RATE_LIMIT_WINDOW_MS,
    maxRequests: REGISTER_RATE_LIMIT_MAX_ATTEMPTS,
  });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds ?? 60));
    res.status(429).json({ error: 'Muitos cadastros em pouco tempo. Aguarde um pouco e tente de novo.' });
    return;
  }

  const { email, password, partyName } = req.body ?? {};
  const validationError = validateRegisterInput(email, password, partyName);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const result = await registerWithPassword(email as string, password as string, partyName as string);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Não foi possível criar a conta.' });
  }
}
