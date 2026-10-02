import { formatTibiaGold } from '@/services/split';
import { animDelay, animDelayMs } from '@/services/common/anim-delay';
import { CountUp } from '@/components/common/CountUp';
import type { DashboardMetricKey } from '@/services/dashboard/monthly-trend';

interface KpiGridStats {
  totalDrops: number;
  pendingCount: number;
  serviceiroDropsCount: number;
  plunderTotal: number;
  plunderCount: number;
  bagsTotal: number;
  bagsCount: number;
}

interface KpiGridProps {
  stats: KpiGridStats;
  bossHuntTotals: { hunt: number; boss: number };
  totalInd: number;
  onMetricClick: (metric: DashboardMetricKey) => void;
}

interface KpiBox {
  metric: DashboardMetricKey;
  label: string;
  value: number;
  /** true → valor em gold (formatTibiaGold, fonte menor); false → contagem inteira */
  isGold: boolean;
  className?: string;
  color?: string;
}

/** Grade dos 10 indicadores clicáveis do Dashboard (cada um abre MonthlyTrendModal com o
 * histórico dos últimos 12 meses, ver DashboardPage.tsx) — extraído em 2026-08-27 pra
 * reduzir o tamanho de DashboardPage.tsx (ver memória "componentes-grandes"). Só
 * apresentação: os números já vêm calculados por props. Desde 2026-10-02 cada box entra em
 * cascata (.anim-entrada) e o número conta até o valor final (CountUp); o "crescer" no hover
 * vem de .stat-box-clicavel em global.css. */
export function KpiGrid({ stats, bossHuntTotals, totalInd, onMetricClick }: KpiGridProps) {
  const boxes: KpiBox[] = [
    { metric: 'qtdDrops', label: 'Qtd Drops', value: stats.totalDrops, isGold: false, color: 'var(--color-text)' },
    { metric: 'qtdNVendido', label: 'Qtd N Vendido', value: stats.pendingCount, isGold: false, color: 'var(--color-warning)' },
    { metric: 'qtdServiceiro', label: 'Qtd Serviceiro', value: stats.serviceiroDropsCount, isGold: false, color: 'var(--color-accent)' },
    { metric: 'kksPlunderInd', label: 'KKs Plunder(ind)', value: stats.plunderTotal, isGold: true, className: 'texto-sucesso' },
    { metric: 'kksHunt', label: 'KKs Hunt', value: bossHuntTotals.hunt, isGold: true, color: 'var(--color-text)' },
    { metric: 'qtdBags', label: 'Qtd Bags', value: stats.bagsCount, isGold: false, color: 'var(--color-text)' },
    { metric: 'qtdPlunders', label: 'Qtd Plunders', value: stats.plunderCount, isGold: false, color: 'var(--color-text)' },
    { metric: 'totalInd', label: 'Total (ind)', value: totalInd, isGold: true, className: 'texto-sucesso' },
    { metric: 'kksBagsInd', label: 'KKs Bags(ind)', value: stats.bagsTotal, isGold: true, className: 'texto-sucesso' },
    { metric: 'kksBoss', label: 'KKs Boss', value: bossHuntTotals.boss, isGold: true, color: 'var(--color-accent)' },
  ];

  return (
    <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
      {boxes.map((box, index) => (
        <div
          key={box.metric}
          className="stat-box stat-box-clicavel anim-entrada"
          style={animDelay(index, 40)}
          onClick={() => onMetricClick(box.metric)}
          title="Ver últimos 12 meses"
        >
          <span className="stat-box-rotulo">{box.label}</span>
          <strong className={box.className} style={{ fontSize: box.isGold ? '11px' : '14px', color: box.color }}>
            <CountUp value={box.value} format={box.isGold ? formatTibiaGold : undefined} delayMs={animDelayMs(index, 40)} />
          </strong>
        </div>
      ))}
    </div>
  );
}
