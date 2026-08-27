import { formatTibiaGold } from '@/services/split';
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

/** Grade dos 10 indicadores clicáveis do Dashboard (cada um abre MonthlyTrendModal com o
 * histórico dos últimos 12 meses, ver DashboardPage.tsx) — extraído em 2026-08-27 pra
 * reduzir o tamanho de DashboardPage.tsx (ver memória "componentes-grandes"). Só
 * apresentação: os números já vêm calculados por props. */
export function KpiGrid({ stats, bossHuntTotals, totalInd, onMetricClick }: KpiGridProps) {
  return (
    <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
      <div className="stat-box stat-box-clicavel" onClick={() => onMetricClick('qtdDrops')} title="Ver últimos 12 meses">
        <span className="stat-box-rotulo">Qtd Drops</span>
        <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{stats.totalDrops}</strong>
      </div>
      <div className="stat-box stat-box-clicavel" onClick={() => onMetricClick('qtdNVendido')} title="Ver últimos 12 meses">
        <span className="stat-box-rotulo">Qtd N Vendido</span>
        <strong style={{ fontSize: '14px', color: 'var(--color-warning)' }}>{stats.pendingCount}</strong>
      </div>
      <div className="stat-box stat-box-clicavel" onClick={() => onMetricClick('qtdServiceiro')} title="Ver últimos 12 meses">
        <span className="stat-box-rotulo">Qtd Serviceiro</span>
        <strong style={{ fontSize: '14px', color: 'var(--color-accent)' }}>{stats.serviceiroDropsCount}</strong>
      </div>
      <div className="stat-box stat-box-clicavel" onClick={() => onMetricClick('kksPlunderInd')} title="Ver últimos 12 meses">
        <span className="stat-box-rotulo">KKs Plunder(ind)</span>
        <strong className="texto-sucesso" style={{ fontSize: '11px' }}>{formatTibiaGold(stats.plunderTotal)}</strong>
      </div>
      <div className="stat-box stat-box-clicavel" onClick={() => onMetricClick('kksHunt')} title="Ver últimos 12 meses">
        <span className="stat-box-rotulo">KKs Hunt</span>
        <strong style={{ fontSize: '11px', color: 'var(--color-text)' }}>{formatTibiaGold(bossHuntTotals.hunt)}</strong>
      </div>

      <div className="stat-box stat-box-clicavel" onClick={() => onMetricClick('qtdBags')} title="Ver últimos 12 meses">
        <span className="stat-box-rotulo">Qtd Bags</span>
        <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{stats.bagsCount}</strong>
      </div>
      <div className="stat-box stat-box-clicavel" onClick={() => onMetricClick('qtdPlunders')} title="Ver últimos 12 meses">
        <span className="stat-box-rotulo">Qtd Plunders</span>
        <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{stats.plunderCount}</strong>
      </div>
      <div className="stat-box stat-box-clicavel" onClick={() => onMetricClick('totalInd')} title="Ver últimos 12 meses">
        <span className="stat-box-rotulo">Total (ind)</span>
        <strong className="texto-sucesso" style={{ fontSize: '11px' }}>{formatTibiaGold(totalInd)}</strong>
      </div>
      <div className="stat-box stat-box-clicavel" onClick={() => onMetricClick('kksBagsInd')} title="Ver últimos 12 meses">
        <span className="stat-box-rotulo">KKs Bags(ind)</span>
        <strong className="texto-sucesso" style={{ fontSize: '11px' }}>{formatTibiaGold(stats.bagsTotal)}</strong>
      </div>
      <div className="stat-box stat-box-clicavel" onClick={() => onMetricClick('kksBoss')} title="Ver últimos 12 meses">
        <span className="stat-box-rotulo">KKs Boss</span>
        <strong style={{ fontSize: '11px', color: 'var(--color-accent)' }}>{formatTibiaGold(bossHuntTotals.boss)}</strong>
      </div>
    </div>
  );
}
