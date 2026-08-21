import type { LootDrop } from '@/types';
import type { SplitLogDailyEntry } from '@/hooks/useSplitLogsDaily';

export interface MonthBucket {
  /** 'YYYY-MM' */
  key: string;
  /** 'mmm/aa', ex 'ago/26' */
  label: string;
}

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Últimos 12 meses terminando no mês de `reference` (default hoje), mais antigo primeiro
 * — mesma janela de "últimos 365 dias" já usada no Top Drop, só agrupada por mês em vez
 * de dia a dia. Independente do seletor de Mês/Ano da tela (mesmo padrão do Top Drop). */
export function buildLast12Months(reference = new Date()): MonthBucket[] {
  const months: MonthBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MESES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
    months.push({ key, label });
  }
  return months;
}

function monthKeyFromBr(dateStr: string): string | null {
  const [day, month, year] = dateStr.split('/').map(Number);
  if (!day || !month || !year) return null;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export type DashboardMetricKey =
  | 'qtdDrops' | 'qtdNVendido' | 'qtdServiceiro'
  | 'kksPlunderInd' | 'qtdPlunders'
  | 'kksBagsInd' | 'qtdBags'
  | 'kksHunt' | 'kksBoss' | 'totalInd';

interface MonthAccumulator {
  qtdDrops: number;
  qtdNVendido: number;
  qtdServiceiro: number;
  plunderTotal: number;
  qtdPlunders: number;
  bagsTotal: number;
  qtdBags: number;
  hunt: number;
  boss: number;
}

function emptyAccumulator(): MonthAccumulator {
  return { qtdDrops: 0, qtdNVendido: 0, qtdServiceiro: 0, plunderTotal: 0, qtdPlunders: 0, bagsTotal: 0, qtdBags: 0, hunt: 0, boss: 0 };
}

/** Agrega `drops` (últimos 365 dias, já buscados pro Top Drop — mesma fonte, sem fetch
 * novo) e `splitSeries` (todos os split_logs não-escondidos da conta, via
 * useSplitLogsDaily) por mês, replicando EXATAMENTE as mesmas regras dos KPIs "ao vivo"
 * do mês selecionado em DashboardPage.tsx (stats/bossHuntTotals/totalInd) — só que uma
 * vez por mês dos últimos 12, em vez de uma vez só pro mês selecionado. Usado pelo
 * gráfico de tendência mensal (MonthlyTrendModal, 2026-08-21, pedido do usuário: "ao
 * clicar nos campos centrais da dashboard, abrir uma modal com gráfico dos últimos 12
 * meses"). */
export function computeMonthlyTrends(
  months: MonthBucket[],
  drops: LootDrop[],
  splitSeries: SplitLogDailyEntry[],
): Record<DashboardMetricKey, number[]> {
  const byMonth = new Map<string, MonthAccumulator>();

  for (const d of drops) {
    const key = monthKeyFromBr(d.date);
    if (!key) continue;
    const entry = byMonth.get(key) ?? emptyAccumulator();
    entry.qtdDrops += 1;
    if (!d.sold) entry.qtdNVendido += 1;
    // Vezes que um serviceiro aparece (soma de services.length), não "drops com
    // serviceiro" — mesma definição de stats.serviceiroDropsCount em DashboardPage.tsx
    // (bug corrigido em 2026-08-21, ver comentário lá).
    entry.qtdServiceiro += d.party.services.length;
    if (d.bossName === 'Plunder') {
      entry.plunderTotal += d.unitValue;
      entry.qtdPlunders += 1;
    } else if (d.bossName !== 'SoulCore') {
      entry.bagsTotal += d.unitValue;
      entry.qtdBags += 1;
    }
    byMonth.set(key, entry);
  }

  for (const s of splitSeries) {
    const key = monthKeyFromBr(s.date);
    if (!key) continue;
    const entry = byMonth.get(key) ?? emptyAccumulator();
    entry.hunt += s.hunt ?? 0;
    entry.boss += s.boss ?? 0;
    byMonth.set(key, entry);
  }

  const result: Record<DashboardMetricKey, number[]> = {
    qtdDrops: [], qtdNVendido: [], qtdServiceiro: [],
    kksPlunderInd: [], qtdPlunders: [],
    kksBagsInd: [], qtdBags: [],
    kksHunt: [], kksBoss: [], totalInd: [],
  };

  for (const m of months) {
    const e = byMonth.get(m.key) ?? emptyAccumulator();
    result.qtdDrops.push(e.qtdDrops);
    result.qtdNVendido.push(e.qtdNVendido);
    result.qtdServiceiro.push(e.qtdServiceiro);
    result.kksPlunderInd.push(e.plunderTotal);
    result.qtdPlunders.push(e.qtdPlunders);
    result.kksBagsInd.push(e.bagsTotal);
    result.qtdBags.push(e.qtdBags);
    result.kksHunt.push(e.hunt);
    result.kksBoss.push(e.boss);
    result.totalInd.push(e.plunderTotal + e.bagsTotal + e.hunt + e.boss);
  }

  return result;
}
