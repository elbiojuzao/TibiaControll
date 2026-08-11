/**
 * Lê a aba "Xp Realizada" da planilha Google Sheets do usuário (rotina automática dele,
 * já roda fora do app — a gente só consome o resultado) e calcula xpOntem/xp30Dias por
 * personagem. Fica em api/_lib (não api/) porque é lógica pura, sem depender do formato
 * de request/response do Vercel — assim dá pra reusar tanto na function serverless
 * (api/xp-sheet.ts) quanto no plugin de dev do Vite (vite.config.ts), que serve o mesmo
 * endpoint localmente sem precisar do `vercel dev`.
 *
 * Não busca aqui a tabela de "metas por nível" (XP/dia restante pra bater cada nível até
 * o fim do ano) — continua mock por enquanto. "Previsão fim de ano" (nível único, não a
 * tabela de metas) já usa xp90Dias daqui — ver services/xp-sheet/level-prediction.ts.
 *
 * ID/gid da planilha vêm de env vars (XP_SHEET_ID, XP_SHEET_XP_REALIZADA_GID), não de
 * constante no código — o repo é público no GitHub e a planilha é compartilhada como
 * "qualquer um com o link pode ver", então o ID sozinho já dá acesso de leitura total a
 * ela. Sem prefixo VITE_ de propósito: essas env vars só existem no lado servidor
 * (Vercel Function / vite.config.ts em dev), nunca vão pro bundle do client.
 */
import { parseCsv, parseBrNumber } from './sheet-utils.js';

const DAYS_FOR_XP_30_DIAS = 30;
/** Janela maior usada só pela Previsão fim de ano (mais dias = média diária mais estável
 * que os 30 dias usados pro card "Xp 30Dias") — pedido do usuário em 2026-08-10. */
const DAYS_FOR_XP_90_DIAS = 90;

export interface XpDailyEntry {
  /** DD/MM/YYYY, mesmo formato usado no resto do app (drops, hunts) */
  date: string;
  value: number;
}

export interface XpDailyStats {
  xpOntem: number;
  xp30Dias: number;
  xp90Dias: number;
  /** Histórico completo (não só os últimos 30/90 dias) — mais antigo primeiro. Usado pra
   * buscar um dia específico (ex: modal do calendário), não só os agregados prontos. */
  series: XpDailyEntry[];
}

export async function fetchXpStatsFromSheet(): Promise<Record<string, XpDailyStats>> {
  const sheetId = process.env.XP_SHEET_ID;
  const gid = process.env.XP_SHEET_XP_REALIZADA_GID;
  if (!sheetId || !gid) {
    throw new Error('XP_SHEET_ID / XP_SHEET_XP_REALIZADA_GID não configuradas (env var ausente no servidor).');
  }

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao buscar a planilha de XP (status ${res.status})`);

  const csv = await res.text();
  const rows = parseCsv(csv);
  if (rows.length < 2) return {};

  const [header, ...dataRows] = rows;
  const dayIndex = header.findIndex((h) => h.trim().toLowerCase() === 'dia');
  const charColumns = header
    .map((name, index) => ({ name: name.trim(), index }))
    .filter(({ name, index }) => name && index !== dayIndex);

  const result: Record<string, XpDailyStats> = {};
  for (const { name, index } of charColumns) {
    // A planilha tem linhas de datas futuras pré-preenchidas mas ainda vazias (a
    // rotina do usuário só grava até o dia corrente) — filtra pra pegar só as
    // linhas onde essa coluna de fato tem dado, senão "xpOntem" vira sempre 0.
    const series: XpDailyEntry[] = dataRows
      .map((row) => ({ date: (row[dayIndex] ?? '').trim(), raw: row[index] }))
      .filter(({ raw }) => (raw ?? '').trim() !== '')
      .map(({ date, raw }) => ({ date, value: parseBrNumber(raw) }));

    const xpOntem = series[series.length - 1]?.value ?? 0;
    const xp30Dias = series.slice(-DAYS_FOR_XP_30_DIAS).reduce((sum, e) => sum + e.value, 0);
    const xp90Dias = series.slice(-DAYS_FOR_XP_90_DIAS).reduce((sum, e) => sum + e.value, 0);
    result[name] = { xpOntem, xp30Dias, xp90Dias, series };
  }
  return result;
}
