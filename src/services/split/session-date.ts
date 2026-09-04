import { dateAsBr } from '@/services/common/br-date';
import type { SplitLogType } from '@/types';

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

/** Extrai a duração total da sessão a partir do cabeçalho "Session: HH:MMh" do Party Hunt
 * Analyzer, em minutos — 2026-08-23, pedido do usuário: "o dano medio eu acho que esta
 * errado pois a hunt ela pode durar 2 ou 3 horas tem que analisar isso antes". Usada pra
 * normalizar as médias de dano/cura por HORA no Histórico de Splits (uma hunt de 3h tem
 * mais dano bruto que uma de 1h só pela duração, comparar o total bruto distorce). Retorna
 * null se o log não tiver essa linha (nunca inventa uma duração). */
export function extractSplitDurationMinutes(rawLog: string): number | null {
  const match = rawLog.match(/^Session:\s*(\d{1,2}):(\d{2})h/im);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Converte `durationMinutes` de um split em HORAS pra normalizar dano/cura por hora,
 * aplicando a mesma regra já usada em `SplitsHistoricoPage.tsx` (extraída de lá em
 * 2026-09-04 pra reusar no detalhe de UM split individual, não só na média agregada
 * histórica): Hunt arredonda pra hora CHEIA abaixo (`Math.floor`) — "Session: HH:MMh" mede
 * tempo de relógio do início ao fim, não tempo de caça ativa, e os minutos que sobram
 * depois da última hora completa costumam ser pausa (abastecer poção/soul), não hunt de
 * verdade. Boss usa a duração exata (geralmente dura menos de 1h — o floor zeraria a
 * maioria). Retorna `null` (nunca um valor inventado) se `durationMinutes` for `null` ou
 * se o arredondamento zerar a duração (hunt com menos de 1h completa). */
export function splitHoursForType(type: SplitLogType, durationMinutes: number | null): number | null {
  if (!durationMinutes) return null;
  const hours = type === 'hunt' ? Math.floor(durationMinutes / 60) : durationMinutes / 60;
  return hours > 0 ? hours : null;
}
