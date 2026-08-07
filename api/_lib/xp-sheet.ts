/**
 * Lê a aba "Xp Realizada" da planilha Google Sheets do usuário (rotina automática dele,
 * já roda fora do app — a gente só consome o resultado) e calcula xpOntem/xp30Dias por
 * personagem. Fica em api/_lib (não api/) porque é lógica pura, sem depender do formato
 * de request/response do Vercel — assim dá pra reusar tanto na function serverless
 * (api/xp-sheet.ts) quanto no plugin de dev do Vite (vite.config.ts), que serve o mesmo
 * endpoint localmente sem precisar do `vercel dev`.
 *
 * Não busca aqui a tabela de "metas por nível" (previsão de XP/dia pra bater cada nível
 * até o fim do ano) — o usuário confirmou que isso continua mock por enquanto.
 */
import { parseCsv, parseBrNumber } from './sheet-utils';

const SHEET_ID = '1dDdNGq9paaJPxlyInZPQWw_1S5RZfK199TJO4HBiKtY';
const XP_REALIZADA_GID = '421841615';
const DAYS_FOR_XP_30_DIAS = 30;

export interface XpDailyEntry {
  /** DD/MM/YYYY, mesmo formato usado no resto do app (drops, hunts) */
  date: string;
  value: number;
}

export interface XpDailyStats {
  xpOntem: number;
  xp30Dias: number;
  /** Histórico completo (não só os últimos 30 dias) — mais antigo primeiro. Usado pra
   * buscar um dia específico (ex: modal do calendário), não só os agregados prontos. */
  series: XpDailyEntry[];
}

export async function fetchXpStatsFromSheet(): Promise<Record<string, XpDailyStats>> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${XP_REALIZADA_GID}`;
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
    result[name] = { xpOntem, xp30Dias, series };
  }
  return result;
}
