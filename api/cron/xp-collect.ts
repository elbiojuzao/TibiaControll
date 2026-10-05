import { collectXpSnapshots } from '../_lib/xp-collect.js';

/** Vercel Cron — GET /api/cron/xp-collect, agendado em vercel.json (todo dia 09:30 UTC =
 * 06:30 BRT). A rota é pública por natureza (qualquer um pode digitar a URL), então exige
 * `Authorization: Bearer ${CRON_SECRET}` — header que a própria Vercel injeta nas execuções
 * do Cron quando a env var CRON_SECRET existe no projeto. Tipado à mão (sem @vercel/node), mesmo
 * estilo de api/login.ts. */
export default async function handler(
  req: { method?: string; headers?: Record<string, string | string[] | undefined> },
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

  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers?.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }

  try {
    const result = await collectXpSnapshots();
    res.setHeader('Cache-Control', 'no-store');
    // 200 mesmo com falhas parciais: o corpo lista quem falhou (aparece nos logs da Vercel).
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao coletar XP' });
  }
}
