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

const SHEET_ID = '1dDdNGq9paaJPxlyInZPQWw_1S5RZfK199TJO4HBiKtY';
const XP_REALIZADA_GID = '421841615';
const DAYS_FOR_XP_30_DIAS = 30;

export interface XpDailyStats {
  xpOntem: number;
  xp30Dias: number;
}

/** Parser CSV simples, mas correto pra campos entre aspas (padrão de export do Google Sheets) */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** "077.648.574" -> 77648574 ; "-449.889.808" -> -449889808 */
function parseXpNumber(raw: string): number {
  const cleaned = (raw ?? '').trim().replace(/\./g, '');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

export async function fetchXpStatsFromSheet(): Promise<Record<string, XpDailyStats>> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${XP_REALIZADA_GID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao buscar a planilha de XP (status ${res.status})`);

  const csv = await res.text();
  const rows = parseCsv(csv);
  if (rows.length < 2) return {};

  const [header, ...dataRows] = rows;
  const charColumns = header
    .map((name, index) => ({ name: name.trim(), index }))
    .filter(({ name }) => name && name.toLowerCase() !== 'dia');

  const result: Record<string, XpDailyStats> = {};
  for (const { name, index } of charColumns) {
    // A planilha tem linhas de datas futuras pré-preenchidas mas ainda vazias (a
    // rotina do usuário só grava até o dia corrente) — filtra pra pegar só as
    // linhas onde essa coluna de fato tem dado, senão "xpOntem" vira sempre 0.
    const filledValues = dataRows
      .map((row) => row[index])
      .filter((raw) => (raw ?? '').trim() !== '')
      .map(parseXpNumber);

    const xpOntem = filledValues[filledValues.length - 1] ?? 0;
    const xp30Dias = filledValues.slice(-DAYS_FOR_XP_30_DIAS).reduce((sum, v) => sum + v, 0);
    result[name] = { xpOntem, xp30Dias };
  }
  return result;
}
