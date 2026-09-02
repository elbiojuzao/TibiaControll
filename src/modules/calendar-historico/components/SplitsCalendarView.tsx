import { useMemo, useState } from 'react';
import { buildMonthCells } from '@/services/calendar';
import { formatTibiaGold } from '@/services/split';
import type { SplitRow } from '../SplitsHistoricoPage';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface SplitsCalendarViewProps {
  /** Já filtrado por player/tipo (ver SplitsHistoricoPage) — SEM o filtro de janela "Ver
   * últimos", já que aqui a navegação é por mês, igual ao Calendário principal. */
  rows: SplitRow[];
  onSelectDate: (dateKey: string) => void;
}

/** Modo calendário do Histórico de Splits (2026-09-02, pedido do usuário: "vamos fazer o
 * botão para filtrar apenas boss e hunt e tambem fazer ele ficar em modo calendario") —
 * mesma estrutura visual do Calendário principal (CalendarioPage.tsx: header com
 * navegação de mês, legenda, grid 7 colunas, `calendar-dot`), reaproveitando
 * `buildMonthCells` (extraído pra services/calendar nesse mesmo pedido). Diferente do
 * Calendário principal, aqui os "dias com atividade" vêm direto dos splits SALVOS
 * (SplitRow[], já carregados pela página-mãe via useSplitLogsList) — não usa
 * useSplitLogsDaily (aquele soma por dia/tipo pro Calendário; aqui a página já tem os
 * splits individuais, então agrupar localmente evita um 2º fetch/hook). */
export function SplitsCalendarView({ rows, onSelectDate }: SplitsCalendarViewProps) {
  const now = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const { year: viewYear, month: viewMonth } = view;

  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);

  const rowsByDate = useMemo(() => {
    const map = new Map<string, SplitRow[]>();
    for (const row of rows) {
      const list = map.get(row.date) ?? [];
      list.push(row);
      map.set(row.date, list);
    }
    return map;
  }, [rows]);

  const goToPrevMonth = () => {
    setView((v) => {
      const d = new Date(v.year, v.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToNextMonth = () => {
    setView((v) => {
      const d = new Date(v.year, v.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToToday = () => setView({ year: now.getFullYear(), month: now.getMonth() });

  const todayKey = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  return (
    <div className="card">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={goToPrevMonth}>‹ Anterior</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="calendar-title">{MONTH_NAMES[viewMonth]} de {viewYear}</span>
          <button className="calendar-nav-btn" onClick={goToToday}>Hoje</button>
        </div>
        <button className="calendar-nav-btn" onClick={goToNextMonth}>Próximo ›</button>
      </div>

      <div className="calendar-legend">
        <span className="calendar-legend-item"><span className="calendar-dot boss" /> Boss</span>
        <span className="calendar-legend-item"><span className="calendar-dot hunt" /> Hunt</span>
      </div>

      <div className="calendar-grid" style={{ marginBottom: '6px' }}>
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="calendar-weekday">{wd}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell, idx) => {
          const daySplits = rowsByDate.get(cell.dateKey) ?? [];
          const bossSplits = daySplits.filter((r) => r.type === 'boss');
          const huntSplits = daySplits.filter((r) => r.type === 'hunt');
          const hasBoss = bossSplits.length > 0;
          const hasHunt = huntSplits.length > 0;
          const hasAnyIndicator = hasBoss || hasHunt;

          return (
            <div
              key={idx}
              onClick={() => { if (hasAnyIndicator) onSelectDate(cell.dateKey); }}
              title={hasAnyIndicator ? 'Clique para ver os splits do dia' : undefined}
              className={`calendar-day${cell.inCurrentMonth ? '' : ' outside-month'}${hasAnyIndicator ? ' has-activity' : ''}${cell.dateKey === todayKey ? ' today' : ''}`}
              style={{ cursor: hasAnyIndicator ? 'pointer' : 'default' }}
            >
              <span className="calendar-day-number">{cell.day}</span>

              {hasAnyIndicator && (
                <div className="calendar-day-dots">
                  {hasBoss && <span className="calendar-dot boss" title="Boss" />}
                  {hasHunt && <span className="calendar-dot hunt" title="Hunt" />}
                </div>
              )}

              {hasAnyIndicator && (
                <div className="calendar-tooltip">
                  <div className="calendar-tooltip-title">{cell.dateKey}</div>
                  <div className="calendar-tooltip-item">
                    {hasBoss && (
                      <>🐲 Boss: <strong style={{ color: 'var(--color-accent)' }}>{formatTibiaGold(bossSplits.reduce((sum, r) => sum + r.equalShare, 0))}</strong>{bossSplits.length > 1 ? ` (${bossSplits.length})` : ''}<br /></>
                    )}
                    {hasHunt && (
                      <>🗡️ Hunt: <strong style={{ color: 'var(--color-warning)' }}>{formatTibiaGold(huntSplits.reduce((sum, r) => sum + r.equalShare, 0))}</strong>{huntSplits.length > 1 ? ` (${huntSplits.length})` : ''}</>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
