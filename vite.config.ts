// defineConfig vem de 'vitest/config' (não 'vite') pra também tipar o campo `test` abaixo
// — é um re-export 100% compatível do defineConfig do Vite, só com esse campo a mais; não
// muda nada em `npm run dev`/`npm run build`, que ignoram `test`. loadEnv não é reexportado
// por 'vitest/config', então continua vindo direto de 'vite'.
import { defineConfig } from 'vitest/config'
import { loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from '@rollup/plugin-yaml'
import path from 'path'
import { checkRateLimit, clientKeyFromRequest } from './api/_lib/rate-limit'
import { loginWithPassword, LOGIN_RATE_LIMIT_WINDOW_MS, LOGIN_RATE_LIMIT_MAX_ATTEMPTS } from './api/_lib/login'
import {
  registerWithPassword,
  validateRegisterInput,
  REGISTER_RATE_LIMIT_WINDOW_MS,
  REGISTER_RATE_LIMIT_MAX_ATTEMPTS,
} from './api/_lib/register'
import type { IncomingMessage } from 'http'

/** Lê o corpo JSON de um request cru do Node — o middleware do Vite não faz parsing de
 * body sozinho (diferente da Vercel Function em produção, que já entrega `req.body`
 * pronto), então isso precisa ser feito à mão aqui. */
function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err instanceof Error ? err : new Error('JSON inválido no corpo da requisição.'))
      }
    })
    req.on('error', reject)
  })
}

/** Serve a rota /api/login no `npm run dev` — em produção quem atende é a Vercel Function
 * em api/login.ts, que reusa a mesma lógica (api/_lib/login.ts). Proteção de força bruta
 * no login (2026-09-30, pedido do usuário) precisa ser testável localmente. */
function loginDevApiPlugin(): Plugin {
  return {
    name: 'login-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/login', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }

        const rateLimit = checkRateLimit(`login:${clientKeyFromRequest(req)}`, { windowMs: LOGIN_RATE_LIMIT_WINDOW_MS, maxRequests: LOGIN_RATE_LIMIT_MAX_ATTEMPTS })
        if (!rateLimit.allowed) {
          res.statusCode = 429
          res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds ?? 60))
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Muitas tentativas de login. Aguarde alguns minutos e tente de novo.' }))
          return
        }

        try {
          const { email, password } = await readJsonBody(req)
          if (!email || !password) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Informe e-mail e senha.' }))
            return
          }
          const session = await loginWithPassword(String(email), String(password))
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(session))
        } catch (err) {
          res.statusCode = 401
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Falha ao entrar.' }))
        }
      })
      // /api/register (2026-10-05) — em produção quem atende é api/register.ts.
      server.middlewares.use('/api/register', async (req, res) => {
        const sendJson = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }

        const rateLimit = checkRateLimit(`register:${clientKeyFromRequest(req)}`, { windowMs: REGISTER_RATE_LIMIT_WINDOW_MS, maxRequests: REGISTER_RATE_LIMIT_MAX_ATTEMPTS })
        if (!rateLimit.allowed) {
          res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds ?? 60))
          sendJson(429, { error: 'Muitos cadastros em pouco tempo. Aguarde um pouco e tente de novo.' })
          return
        }

        try {
          const { email, password, partyName } = await readJsonBody(req)
          const validationError = validateRegisterInput(email, password, partyName)
          if (validationError) {
            sendJson(400, { error: validationError })
            return
          }
          sendJson(200, await registerWithPassword(String(email), String(password), String(partyName)))
        } catch (err) {
          sendJson(400, { error: err instanceof Error ? err.message : 'Não foi possível criar a conta.' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // loadEnv com prefixo '' (não só VITE_) pra jogar o .env.local inteiro no process.env: o
  // plugin de dev do login (api/_lib/login.ts) lê VITE_SUPABASE_URL/PUBLISHABLE_KEY via
  // process.env, igual faz na Vercel Function — o Vite só injeta import.meta.env.VITE_*
  // no código do client, não no process.env do servidor de dev.
  const env = loadEnv(mode, process.cwd(), '')
  process.env = { ...process.env, ...env }

  return {
    // yaml(): só pro `import data from '../../data.yaml'` do módulo copiado do tibia-wheel
    // (gitlab.com/klhio/tibia-wheel) rodar sem alterar esse import — o Parcel (bundler
    // original deles) entende .yaml nativo, o Vite não.
    plugins: [react(), yaml(), loginDevApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      // Só testes de unidade puros por enquanto (services/*, funções sem DOM) — ambiente
      // 'node' é bem mais rápido que 'jsdom' e é tudo que essa 1ª leva de testes precisa.
      // Se/quando entrar teste de componente React, ele muda pra 'jsdom' (com
      // @testing-library/react) só naqueles arquivos via docblock `@vitest-environment`.
      environment: 'node',
      include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
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
