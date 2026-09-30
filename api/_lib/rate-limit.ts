/**
 * Limite de requisições simples, em memória, por chave (normalmente IP) — sem dependência
 * nova. Best-effort: cada instância serverless do Vercel tem seu próprio estado (não é um
 * limite global exato entre instâncias, e zera a cada cold start), mas soma-se ao
 * Cache-Control já existente em api/xp-sheet.ts pra cobrir o caso real (scraper/loop
 * travado batendo direto na function, ignorando o cache do edge). Módulo compartilhado
 * entre a Vercel Function (api/xp-sheet.ts) e o plugin de dev do Vite (vite.config.ts),
 * mesmo espírito de api/_lib/xp-sheet.ts (lógica pura, sem depender do formato de
 * request/response de nenhum dos dois runtimes).
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Só presente quando allowed=false — quantos segundos até a janela liberar de novo. */
  retryAfterSeconds?: number;
}

/** `windowMs`/`maxRequests` opcionais (2026-09-30, pedido do usuário: limitar tentativas de
 * login) — cada chamador pode ter sua própria janela/teto sem afetar os outros, já que o
 * `Map` é compartilhado só pelo texto da `key` (por isso login usa chave prefixada
 * `login:{ip}`, nunca colidindo com a chave crua de IP do xp-sheet). Sem os parâmetros,
 * comportamento idêntico ao de sempre (20 req/min) — xp-sheet.ts não precisou mudar. */
export function checkRateLimit(key: string, options?: { windowMs?: number; maxRequests?: number }): RateLimitResult {
  const windowMs = options?.windowMs ?? WINDOW_MS;
  const maxRequests = options?.maxRequests ?? MAX_REQUESTS_PER_WINDOW;
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    hits.set(key, timestamps);
    const retryAfterSeconds = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  // Evita o Map crescer sem limite se muitos IPs diferentes baterem dentro da vida dessa
  // instância — poda quem não tem nenhum hit dentro da janela atual.
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
    }
  }

  return { allowed: true };
}

/** Extrai um identificador razoável do cliente a partir do request. `x-forwarded-for`
 * (Vercel sempre popula em produção; pode ter vários IPs separados por vírgula quando
 * passa por mais de um proxy — o primeiro é o do cliente original) com fallback pro
 * socket remoto (dev local via Vite, onde não existe proxy nenhum). */
export function clientKeyFromRequest(req: {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const forwardedIp = forwardedValue?.split(',')[0]?.trim();
  return forwardedIp || req.socket?.remoteAddress || 'unknown';
}
