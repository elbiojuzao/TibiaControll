import { dateAsBr } from '@/services/common/br-date';

/** Extrai a data de TÉRMINO da sessão a partir do cabeçalho "Session data: From
 * YYYY-MM-DD, HH:MM:SS to YYYY-MM-DD, HH:MM:SS" do Party Hunt Analyzer, já aplicando a
 * regra de corte do dia (2026-08-19, pedido do usuário ao salvar splits no banco): uma
 * sessão que termina entre 00:00 e 00:59 conta pro dia ANTERIOR, não pro dia do
 * calendário em que o relógio realmente virou. Retorna null se o log não tiver esse
 * cabeçalho no formato esperado (não deveria acontecer — handleParseLog já valida que o
 * log começa com "Session data:" antes de chegar aqui). */
export function extractSplitSessionDate(rawLog: string): string | null {
  const match = rawLog.match(
    /Session data:\s*From\s+\d{4}-\d{2}-\d{2},\s*\d{2}:\d{2}:\d{2}\s*to\s+(\d{4})-(\d{2})-(\d{2}),\s*(\d{2}):\d{2}:\d{2}/i,
  );
  if (!match) return null;

  const [, year, month, day, hour] = match;
  const endDate = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number(hour) < 1) {
    endDate.setDate(endDate.getDate() - 1);
  }

  return dateAsBr(endDate);
}
