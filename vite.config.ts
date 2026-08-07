import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fetchXpStatsFromSheet } from './api/_lib/xp-sheet'
import { fetchBossHuntFromSheet } from './api/_lib/boss-hunt-sheet'

/** Serve as rotas /api/xp-sheet e /api/boss-hunt-sheet no `npm run dev` (Vite puro) —
 * em produção quem atende essas rotas são as Vercel Functions em api/*.ts, que reusam
 * a mesma lógica. Sem isso só daria pra testar essas integrações depois de publicar
 * no Vercel. */
function sheetDevApiPlugin(): Plugin {
  return {
    name: 'sheet-dev-api',
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

      server.middlewares.use('/api/boss-hunt-sheet', async (_req, res) => {
        try {
          const series = await fetchBossHuntFromSheet()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ series }))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro ao buscar planilha de Boss/Hunt' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sheetDevApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
