import { fetchBossHuntFromSheet } from './_lib/boss-hunt-sheet.js';

/** Vercel Node Function — GET /api/boss-hunt-sheet. Mesmo padrão de api/xp-sheet.ts
 * (tipado à mão, sem @vercel/node). */
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
    const series = await fetchBossHuntFromSheet();
    // Sem cache de CDN — o Dashboard depende desse endpoint pra mostrar KKs Hunt/Boss
    // sempre atualizados a cada entrada no sistema (pedido explícito do usuário).
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ series });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Erro ao buscar planilha de Boss/Hunt' });
  }
}
