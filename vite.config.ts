import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fetchXpStatsFromSheet } from './api/_lib/xp-sheet'

/** Serve a rota /api/xp-sheet no `npm run dev` (Vite puro) — em produção quem atende
 * essa rota é a Vercel Function em api/xp-sheet.ts, que reusa a mesma lógica. Sem isso
 * só daria pra testar essa integração depois de publicar no Vercel.
 *
 * Existia uma rota irmã /api/boss-hunt-sheet (planilha "Boss hunt") até 2026-08-20 —
 * removida junto com useBossHuntSheet quando Dashboard/Calendário migraram KKs Hunt/Boss
 * pra ler de split_logs (banco) em vez da planilha, ver useSplitLogsDaily. */
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
    build: {
      rollupOptions: {
        output: {
          // Vendor libs em chunk próprio, separado do código do app (2026-08-27) — junto
          // com o lazy() por rota em App.tsx, ataca o aviso de bundle >500kB de verdade
          // (code-splitting) em vez de só levantar o limite do aviso. react/react-dom/
          // react-router-dom mudam bem menos que o código do app, então ficam cacheados no
          // navegador entre deploys; @supabase/supabase-js fica à parte por ser pesado
          // sozinho (~100kB) e usado só depois do login.
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
          },
        },
      },
    },
  }
})
