import { Modal } from '@/components/common/Modal';
import { formatTibiaGold } from '@/services/split';
import { formatGoldKK } from '@/services/common/gold-format';
import type { MonthBucket } from '@/services/dashboard/monthly-trend';

export interface StackedSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

interface MonthlyTrendModalProps {
  title: string;
  /** Se true, os valores são gold (formatados com kk); se false, são contagens simples. */
  isCurrency: boolean;
  months: MonthBucket[];
  values: number[];
  onClose: () => void;
  /** Quando fornecido, cada barra mensal vira uma pilha desses segmentos coloridos em vez
   * de uma barra sólida — a soma de todos os segmentos de um mês deve bater com `values[i]`.
   * Usado só pro "Total (ind)" (2026-08-27, pedido do usuário: "mostrar em uma cor o
   * proveniente de Hunt outra cor boss outra cor itens (todos os boss exceto plunder)
   * outra cor itens (plunder), tudo isso na mesma pilha"). */
  stackedSeries?: StackedSeries[];
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
export function MonthlyTrendModal({ title, isCurrency, months, values, onClose, stackedSeries }: MonthlyTrendModalProps) {
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
                  {stackedSeries ? (
                    (() => {
                      let cursorY = CHART_BOTTOM;
                      return stackedSeries.map((series) => {
                        const segValue = series.values[i] ?? 0;
                        const segHeight = (segValue / max) * chartHeight;
                        const segY = cursorY - segHeight;
                        cursorY = segY;
                        if (segHeight <= 0) return null;
                        return (
                          <rect key={series.key} x={x} y={segY} width={barWidth} height={segHeight} fill={series.color}>
                            <title>{`${m.label} — ${series.label}: ${formatValue(segValue)}`}</title>
                          </rect>
                        );
                      });
                    })()
                  ) : (
                    <rect
                      x={x} y={y} width={barWidth} height={Math.max(barHeight, 0)}
                      fill={value > 0 ? 'var(--color-accent)' : 'var(--color-border)'}
                      rx="2"
                    >
                      <title>{`${m.label}: ${formatValue(value)}`}</title>
                    </rect>
                  )}
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

          {stackedSeries && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
              {stackedSeries.map((series) => (
                <span key={series.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: series.color, display: 'inline-block' }} />
                  {series.label}
                </span>
              ))}
            </div>
          )}

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
