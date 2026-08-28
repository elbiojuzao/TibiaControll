import { fetchXpStatsFromSheet } from './_lib/xp-sheet.js';
import { checkRateLimit, clientKeyFromRequest } from './_lib/rate-limit.js';

/** Vercel Node Function — GET /api/xp-sheet. Tipado à mão (sem @vercel/node) pra não
 * adicionar dependência só por causa dos tipos; req/res seguem a assinatura padrão do
 * Node http (compatível com o runtime Node do Vercel). */
export default async function handler(
  req: { method?: string; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } },
  res: {
    status: (code: number) => typeof res;
    json: (body: unknown) => void;
    setHeader: (name: string, value: string) => void;
  },
) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Best-effort — soma-se ao Cache-Control abaixo, ver comentário em _lib/rate-limit.ts.
  const rateLimit = checkRateLimit(clientKeyFromRequest(req));
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds ?? 60));
    res.status(429).json({ error: 'Muitas requisições. Tente de novo em instantes.' });
    return;
  }

  try {
    const stats = await fetchXpStatsFromSheet();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(stats);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Erro ao buscar planilha de XP' });
  }
}
