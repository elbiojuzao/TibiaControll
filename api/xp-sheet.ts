import { fetchXpStatsFromSheet } from './_lib/xp-sheet.js';

/** Vercel Node Function — GET /api/xp-sheet. Tipado à mão (sem @vercel/node) pra não
 * adicionar dependência só por causa dos tipos; req/res seguem a assinatura padrão do
 * Node http (compatível com o runtime Node do Vercel). */
export default async function handler(
  req: { method?: string },
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

  try {
    const stats = await fetchXpStatsFromSheet();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(stats);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Erro ao buscar planilha de XP' });
  }
}
