/**
 * Lê a aba "Boss hunt" da planilha do usuário (mesma planilha de XP, outra aba) —
 * colunas "Data", "profit/ind hunt" e "profit/ind Boss". Os valores já são o profit
 * INDIVIDUAL (o usuário confirmou: já vem dividido — /4 pra hunt, /5 pra boss), então
 * não precisa dividir de novo aqui, só ler e repassar.
 */
import { parseCsv, parseBrNumber } from './sheet-utils.js';

const SHEET_ID = '1dDdNGq9paaJPxlyInZPQWw_1S5RZfK199TJO4HBiKtY';
const BOSS_HUNT_GID = '1868125467';

export interface BossHuntDailyEntry {
  /** DD/MM/YYYY */
  date: string;
  /** profit/ind hunt — já dividido por 4 (tamanho padrão da party de hunt) */
  hunt: number;
  /** profit/ind Boss — já dividido por 5 (party + serviceiro) */
  boss: number;
}

export async function fetchBossHuntFromSheet(): Promise<BossHuntDailyEntry[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${BOSS_HUNT_GID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao buscar a planilha de Boss/Hunt (status ${res.status})`);

  const csv = await res.text();
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const [header, ...dataRows] = rows;
  const dateIndex = header.findIndex((h) => h.trim().toLowerCase() === 'data');
  const huntIndex = header.findIndex((h) => h.trim().toLowerCase().includes('hunt'));
  const bossIndex = header.findIndex((h) => h.trim().toLowerCase().includes('boss'));

  return dataRows
    .map((row) => ({ date: (row[dateIndex] ?? '').trim(), raw: row }))
    .filter(({ date, raw }) => date !== '' && (raw[huntIndex] ?? '').trim() !== '')
    .map(({ date, raw }) => ({
      date,
      hunt: parseBrNumber(raw[huntIndex]),
      boss: parseBrNumber(raw[bossIndex]),
    }));
}
