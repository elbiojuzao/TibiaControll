/**
 * Coleta diária de XP (cron api/cron/xp-collect) — substitui a leitura da planilha Google
 * Sheets do usuário. Pra cada personagem cadastrado (members, de TODAS as contas), lê a XP
 * total (lifetime) nos Highscores do TibiaData e grava um snapshot em member_xp_snapshots:
 * total do dia, total do snapshot anterior e o ganho (diferença).
 *
 * NÃO usa a service role key: fala com o Supabase só pelas duas funções RPC
 * `xp_cron_targets`/`xp_cron_save` (migration 20261002030000), que exigem o CRON_SECRET — se
 * esse segredo vazar, o estrago é "listar personagens e gravar snapshots de XP", não acesso
 * total ao banco. Usa a chave publishable (a mesma do client) só pra passar pelo gateway.
 * Identidade do personagem = members.id (sobrevive a rename), nunca o nome.
 */
import { fetchCharacterWorld, findExperienceValue, type HighscorePageCache } from './tibiadata-xp.js';

interface TargetRow {
  member_id: string;
  account_id: string;
  character_name: string;
  world: string | null;
  prev_total: number | null;
  /** Já existe snapshot de hoje pra esse personagem (coleta anterior bem-sucedida). */
  done_today: boolean;
}

interface SnapshotPayload {
  account_id: string;
  member_id: string;
  data: string;
  xp_total: number;
  xp_total_anterior: number | null;
  xp_ganho: number | null;
}

export interface CollectResult {
  /** YYYY-MM-DD (BRT) gravado nos snapshots */
  date: string;
  processed: number;
  /** Personagens que já tinham coleta bem-sucedida hoje — não são consultados nem regravados. */
  alreadyDone: number;
  failed: { character: string; reason: string }[];
  /** Contas puladas porque TODOS os membros vieram com ganho 0 — sinal de Highscore ainda
   * não atualizado pelo Tibia (aconteceu em 2 de 665 dias do histórico). Nada é gravado; o
   * ganho do dia pulado soma no próximo dia, em vez de ficar um 0 falso no histórico. */
  skippedStaleAccounts: string[];
}

/** Data de hoje em Brasília (UTC-3 fixo — o Brasil não tem horário de verão desde 2019) no
 * formato YYYY-MM-DD. O servidor roda em UTC: sem esse ajuste, uma execução perto da meia-noite
 * UTC gravaria o dia errado. */
export function todayInBrt(now: Date = new Date()): string {
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10);
}

/** Ganho do dia = total de hoje − total do snapshot anterior; null quando não há anterior
 * (1º dia de coleta do personagem — sem baseline não dá pra saber o ganho). Negativo é
 * válido (morte). */
export function computeXpGain(current: number, previous: number | null): number | null {
  return previous === null ? null : current - previous;
}

function config(): { url: string; anonKey: string; secret: string } {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.CRON_SECRET;
  if (!url || !anonKey || !secret) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY / CRON_SECRET não configuradas no servidor.');
  }
  return { url, anonKey, secret };
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { url, anonKey, secret } = config();
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_secret: secret, ...args }),
  });
  if (!res.ok) throw new Error(`Supabase RPC ${fn} falhou (status ${res.status}): ${await res.text()}`);
  return (await res.json()) as T;
}

export async function collectXpSnapshots(now: Date = new Date()): Promise<CollectResult> {
  const date = todayInBrt(now);
  const targets = await rpc<TargetRow[]>('xp_cron_targets', { p_today: date });

  const pageCache: HighscorePageCache = new Map();
  const result: CollectResult = { date, processed: 0, alreadyDone: 0, failed: [], skippedStaleAccounts: [] };
  const rows: SnapshotPayload[] = [];

  // Sequencial de propósito: poucas dezenas de personagens no máximo, e assim o cache de
  // páginas dos Highscores evita requests repetidos ao TibiaData.
  for (const target of targets) {
    if (target.done_today) {
      result.alreadyDone++;
      continue;
    }
    try {
      const world = target.world || (await fetchCharacterWorld(target.character_name));
      if (!world) throw new Error('mundo não encontrado (personagem inexistente no TibiaData?)');

      const xpTotal = await findExperienceValue(world, target.character_name, pageCache);
      if (xpTotal === null) throw new Error(`não apareceu nos Highscores de ${world}`);

      const xpTotalAnterior = target.prev_total === null ? null : Number(target.prev_total);
      rows.push({
        account_id: target.account_id,
        member_id: target.member_id,
        data: date,
        xp_total: xpTotal,
        xp_total_anterior: xpTotalAnterior,
        xp_ganho: computeXpGain(xpTotal, xpTotalAnterior),
      });
    } catch (err) {
      result.failed.push({ character: target.character_name, reason: err instanceof Error ? err.message : 'erro desconhecido' });
    }
  }

  const rowsByAccount = new Map<string, SnapshotPayload[]>();
  for (const row of rows) {
    rowsByAccount.set(row.account_id, [...(rowsByAccount.get(row.account_id) ?? []), row]);
  }
  const toSave: SnapshotPayload[] = [];
  for (const [accountId, accountRows] of rowsByAccount) {
    if (accountRows.every((r) => r.xp_ganho === 0)) result.skippedStaleAccounts.push(accountId);
    else toSave.push(...accountRows);
  }

  if (toSave.length > 0) {
    // account_id só serve pro agrupamento acima — a função do banco deriva a conta de members.
    const payload = toSave.map((row) => ({
      member_id: row.member_id,
      data: row.data,
      xp_total: row.xp_total,
      xp_total_anterior: row.xp_total_anterior,
      xp_ganho: row.xp_ganho,
    }));
    result.processed = await rpc<number>('xp_cron_save', { p_rows: payload });
  }
  return result;
}
