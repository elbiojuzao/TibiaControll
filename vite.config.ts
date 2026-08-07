import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fetchXpStatsFromSheet } from './api/_lib/xp-sheet'

/** Serve /api/xp-sheet no `npm run dev` (Vite puro) — em produção quem atende essa
 * rota é a Vercel Function em api/xp-sheet.ts, que reusa a mesma lógica. Sem isso só
 * daria pra testar essa integração depois de publicar no Vercel. */
function xpSheetDevApiPlugin(): Plugin {
  return {
    name: 'xp-sheet-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/xp-sheet', async (_req, res) => {
        try {
          const stats = await fetchXpStatsFromSheet()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(stats))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro ao buscar planilha de XP' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), xpSheetDevApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
