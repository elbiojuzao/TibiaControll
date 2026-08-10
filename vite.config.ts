import { defineConfig, loadEnv, type Plugin } from 'vite'
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

export default defineConfig(({ mode }) => {
  // loadEnv com prefixo '' (não só VITE_) pra também carregar XP_SHEET_ID e afins do
  // .env.local pro process.env — essas variáveis são server-only de propósito (sem
  // prefixo VITE_, nunca vão pro bundle do client), então o Vite não as injeta sozinho
  // como faz com import.meta.env.VITE_*; o plugin de dev abaixo lê via process.env.
  const env = loadEnv(mode, process.cwd(), '')
  process.env = { ...process.env, ...env }

  return {
    plugins: [react(), sheetDevApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
