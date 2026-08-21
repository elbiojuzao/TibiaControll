import { Modal } from '@/components/common/Modal';
import { formatTibiaGold } from '@/services/split';
import { formatGoldKK } from '@/services/common/gold-format';
import type { MonthBucket } from '@/services/dashboard/monthly-trend';

interface MonthlyTrendModalProps {
  title: string;
  /** Se true, os valores são gold (formatados com kk); se false, são contagens simples. */
  isCurrency: boolean;
  months: MonthBucket[];
  values: number[];
  onClose: () => void;
}

const CHART_LEFT = 20;
const CHART_RIGHT = 660;
const CHART_TOP = 24;
const CHART_BOTTOM = 220;
const BAR_GAP = 8;

/** Gráfico de tendência mensal (2026-08-21, pedido do usuário: "ao clicar nos campos
 * centrais da dashboard, abrir uma modal com gráfico dos últimos 12 meses"). Barra SVG
 * feita à mão (sem lib de gráfico — projeto não tem nenhuma instalada, mesmo padrão já
 * usado pro ícone de compartilhar em DashboardPage.tsx) — 12 barras, mês mais antigo à
 * esquerda. Escopo confirmado com o usuário: só os KPIs financeiros/contagem (que já têm
 * histórico real em drops/split_logs); a tabela de membros (Lvl/Skill/XP) ficou de fora,
 * não tem snapshot diário guardado. */
export function MonthlyTrendModal({ title, isCurrency, months, values, onClose }: MonthlyTrendModalProps) {
  const count = months.length;
  const chartWidth = CHART_RIGHT - CHART_LEFT;
  const barWidth = (chartWidth - BAR_GAP * (count - 1)) / count;
  const chartHeight = CHART_BOTTOM - CHART_TOP;
  const max = Math.max(...values, 1);

  const total = values.reduce((s, v) => s + v, 0);
  const avg = count > 0 ? total / count : 0;
  const formatValue = (v: number) => (isCurrency ? formatGoldKK(v) : v.toLocaleString('pt-BR'));

  const hasAnyData = values.some((v) => v !== 0);

  return (
    <Modal title={`${title} — últimos 12 meses`} onClose={onClose} maxWidth={720}>
      {!hasAnyData && (
        <p className="estado-vazio">Sem dados nos últimos 12 meses.</p>
      )}
      {hasAnyData && (
        <>
          <svg viewBox="0 0 680 260" role="img" aria-label={`Gráfico de barras — ${title} por mês, últimos 12 meses`} style={{ width: '100%', height: 'auto' }}>
            <line x1={CHART_LEFT} y1={CHART_BOTTOM} x2={CHART_RIGHT} y2={CHART_BOTTOM} stroke="var(--color-border)" strokeWidth="1" />
            {months.map((m, i) => {
              const value = values[i] ?? 0;
              const barHeight = (value / max) * chartHeight;
              const x = CHART_LEFT + i * (barWidth + BAR_GAP);
              const y = CHART_BOTTOM - barHeight;
              return (
                <g key={m.key}>
                  <rect
                    x={x} y={y} width={barWidth} height={Math.max(barHeight, 0)}
                    fill={value > 0 ? 'var(--color-accent)' : 'var(--color-border)'}
                    rx="2"
                  >
                    <title>{`${m.label}: ${formatValue(value)}`}</title>
                  </rect>
                  {value !== 0 && (
                    <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="8.5" fill="var(--color-text-muted)">
                      {formatValue(value)}
                    </text>
                  )}
                  <text x={x + barWidth / 2} y={CHART_BOTTOM + 16} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
            <span className="texto-mudo" style={{ fontSize: '12px' }}>
              Total no período: <strong style={{ color: 'var(--color-text)' }}>{isCurrency ? formatTibiaGold(total) : total.toLocaleString('pt-BR')}</strong>
            </span>
            <span className="texto-mudo" style={{ fontSize: '12px' }}>
              Média/mês: <strong style={{ color: 'var(--color-text)' }}>{isCurrency ? formatTibiaGold(Math.round(avg)) : avg.toFixed(1)}</strong>
            </span>
          </div>
        </>
      )}
    </Modal>
  );
}
