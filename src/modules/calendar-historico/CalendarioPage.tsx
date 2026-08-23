import { useEffect, useMemo, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useHunts } from '@/hooks/useHunts';
import { useLootDrops } from '@/hooks/useLootDrops';
import { useMembers } from '@/hooks/useMembers';
import { useXpSheet } from '@/hooks/useXpSheet';
import { useSplitLogsDaily } from '@/hooks/useSplitLogsDaily';
import { useTibiaEvents, isDayInTibiaEvent } from '@/hooks/useTibiaEvents';
import { Modal } from '@/components/common/Modal';
import { formatTibiaGold } from '@/services/split';
import { formatDateKey, findLatestActivityDate, groupActivityByDate } from '@/services/calendar';
import type { TibiaEventCategory } from '@/types';

function formatXp(value: number): string {
  const sign = value < 0 ? '-' : '+';
  return sign + Math.abs(value).toLocaleString('pt-BR');
}

const EVENT_CATEGORY_ICON: Record<TibiaEventCategory, string> = {
  rapid_respawn: '🐇',
  xp_boost: '⭐',
  potion_boost: '🧪',
};

const EVENT_CATEGORY_LABEL: Record<TibiaEventCategory, string> = {
  rapid_respawn: 'Rapid Respawn',
  xp_boost: 'Bônus de XP',
  potion_boost: 'Bônus de Poção',
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface Cell {
  day: number | null;
  dateKey: string | null;
}

function buildMonthCells(year: number, month: number): Cell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Cell[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, dateKey: null });
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, dateKey: formatDateKey(day, month + 1, year) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, dateKey: null });
  return cells;
}

export function CalendarioPage() {
  const { accountId } = useAccount();
  const { hunts, loading: huntsLoading } = useHunts(accountId);
  const { drops, loading: dropsLoading } = useLootDrops(accountId);
  const { members } = useMembers(accountId);
  const { data: xpData } = useXpSheet();
  // Perfil individual de Hunt/Boss do dia (2026-08-19, pedido do usuário: puxar direto de
  // split_logs em vez da planilha externa) — ver useSplitLogsDaily.
  const { series: splitDailySeries, hideDay } = useSplitLogsDaily(accountId);
  const [hidingType, setHidingType] = useState<'hunt' | 'boss' | null>(null);
  const [hideError, setHideError] = useState<string | null>(null);
  const { events: tibiaEvents } = useTibiaEvents();

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [initialized, setInitialized] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const { year: viewYear, month: viewMonth } = view;

  const todayKey = formatDateKey(now.getDate(), now.getMonth() + 1, now.getFullYear());

  // Na primeira carga, pula direto pro mês com atividade mais recente (senão o calendário abre vazio)
  useEffect(() => {
    if (initialized || huntsLoading || dropsLoading) return;
    const latest = findLatestActivityDate(hunts, drops);
    if (latest !== null) {
      const d = new Date(latest);
      setView({ year: d.getFullYear(), month: d.getMonth() });
    }
    setInitialized(true);
  }, [initialized, huntsLoading, dropsLoading, hunts, drops]);

  const activityByDate = useMemo(() => groupActivityByDate(hunts, drops), [hunts, drops]);
  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);

  /** Eventos oficiais fixos (rapid respawn/XP/poção — ver useTibiaEvents) que caem
   * nesse dia do mês em exibição, independente do ano (a data é recorrente). */
  const eventsForDay = (day: number) => tibiaEvents.filter((ev) => isDayInTibiaEvent(viewMonth + 1, day, ev));

  /** XP de cada membro numa data específica (DD/MM/YYYY) — busca no histórico completo
   * da planilha (useXpSheet), não só nos últimos 30 dias, já que o calendário pode
   * navegar pra qualquer mês. */
  const xpForDate = (dateKey: string): { name: string; value: number }[] => {
    return members
      .map((m) => {
        const entry = xpData[m.characterName]?.series.find((e) => e.date === dateKey);
        return entry ? { name: m.characterName, value: entry.value } : null;
      })
      .filter((v): v is { name: string; value: number } => v !== null);
  };

  const selectedActivity = selectedDateKey ? activityByDate.get(selectedDateKey) : undefined;
  const selectedXp = selectedDateKey ? xpForDate(selectedDateKey) : [];
  const selectedSplitDaily = selectedDateKey ? splitDailySeries.find((e) => e.date === selectedDateKey) : undefined;
  const selectedEvents = useMemo(() => {
    if (!selectedDateKey) return [];
    const [day, month] = selectedDateKey.split('/').map(Number);
    return tibiaEvents.filter((ev) => isDayInTibiaEvent(month, day, ev));
  }, [selectedDateKey, tibiaEvents]);

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

  const goToToday = () => {
    setView({ year: now.getFullYear(), month: now.getMonth() });
  };

  // Excluir split de Boss/Hunt do dia (2026-08-19/20, pedido do usuário) — sempre com
  // confirmação, soft delete (ver useSplitLogsDaily/hide() no repository, nunca apaga de
  // verdade). Mesmo padrão do resto do app (confirmação + botão 🗑️, ver ServiceirosPage).
  const handleHideSplit = async (type: 'hunt' | 'boss') => {
    if (!selectedDateKey) return;
    const label = type === 'boss' ? 'Boss' : 'Hunt';
    if (!window.confirm(`Excluir o split de ${label} do dia ${selectedDateKey}? Essa ação não pode ser desfeita por aqui.`)) return;
    setHideError(null);
    setHidingType(type);
    try {
      await hideDay(selectedDateKey, type);
    } catch (err) {
      setHideError(err instanceof Error ? err.message : `Erro ao excluir o split de ${label}.`);
    } finally {
      setHidingType(null);
    }
  };

  return (
    <>
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
          <span className="calendar-legend-item">💎 Item</span>
          <span className="calendar-legend-item"><span className="calendar-swatch event" /> Evento oficial (Rapid Respawn / XP / Poção)</span>
        </div>

        <div className="calendar-grid" style={{ marginBottom: '6px' }}>
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="calendar-weekday">{wd}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {cells.map((cell, idx) => {
            if (cell.day === null) {
              return <div key={idx} className="calendar-day empty" />;
            }

            const activity = activityByDate.get(cell.dateKey!);
            // Existência de split salvo naquele dia (split_logs) — cada tipo (hunt/boss) é
            // independente e null quando não há split daquele tipo salvo nesse dia, sem
            // ambiguidade com "lucro genuinamente zerado" (diferente da leitura antiga da
            // planilha, que não distinguia os dois casos pro Boss).
            const splitDailyEntry = splitDailySeries.find((e) => e.date === cell.dateKey);
            const hasBoss = splitDailyEntry?.boss != null;
            const hasHunt = splitDailyEntry?.hunt != null;
            const hasActivity = !!activity && (activity.hunts.length > 0 || activity.drops.length > 0);
            const dayEvents = eventsForDay(cell.day);
            const hasEvent = dayEvents.length > 0;
            const hasAnyIndicator = hasActivity || hasBoss || hasHunt || hasEvent;

            return (
              <div
                key={idx}
                onClick={() => { setSelectedDateKey(cell.dateKey); setHideError(null); }}
                title="Clique para ver os detalhes do dia"
                className={`calendar-day${hasAnyIndicator ? ' has-activity' : ''}${hasEvent ? ' has-event' : ''}${cell.dateKey === todayKey ? ' today' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <span className="calendar-day-number">{cell.day}</span>

                {hasAnyIndicator && (
                  <div className="calendar-day-dots">
                    {hasBoss && <span className="calendar-dot boss" title="Boss" />}
                    {hasHunt && <span className="calendar-dot hunt" title="Hunt" />}
                    {activity?.drops.map((drop) => (
                      // 2026-08-20, pedido do usuário: trocar a bolinha roxa (.calendar-dot.drop,
                      // removida do CSS) pelo mesmo emoji 💎 já usado na lista de Drops do modal
                      // de detalhes — testado e aprovado antes de virar definitivo.
                      <span key={drop.id} title={drop.itemName} style={{ fontSize: '8px', lineHeight: 1 }}>💎</span>
                    ))}
                  </div>
                )}

                {hasAnyIndicator && (
                  <div className="calendar-tooltip">
                    <div className="calendar-tooltip-title">{cell.dateKey}</div>

                    {hasEvent && dayEvents.map((ev) => (
                      <div key={ev.id} className="calendar-tooltip-item">
                        🚩 <strong style={{ color: 'var(--color-warning)' }}>{ev.name}</strong>
                        <br />
                        {ev.categories.map((cat) => `${EVENT_CATEGORY_ICON[cat]} ${EVENT_CATEGORY_LABEL[cat]}`).join(' · ')}
                      </div>
                    ))}

                    {(hasBoss || hasHunt) && (
                      <div className="calendar-tooltip-item">
                        {hasBoss && <>🐲 Boss: <strong style={{ color: 'var(--color-accent)' }}>{formatXp(splitDailyEntry!.boss!)}</strong><br /></>}
                        {hasHunt && <>🗡️ Hunt: <strong style={{ color: 'var(--color-warning)' }}>{formatXp(splitDailyEntry!.hunt!)}</strong></>}
                      </div>
                    )}

                    {activity?.hunts.map((hunt) => (
                      <div key={hunt.id} className="calendar-tooltip-item">
                        🗡️ Hunt{hunt.bossName ? ` — ${hunt.bossName}` : ''}<br />
                        Profit: <strong className="texto-sucesso">{formatTibiaGold(hunt.profitTotal)}</strong>{' '}
                        · XP: <strong>{hunt.xpGained.toLocaleString('pt-BR')}</strong>
                      </div>
                    ))}

                    {activity?.drops.map((drop) => (
                      <div key={drop.id} className="calendar-tooltip-item">
                        💎 {drop.itemName} <span className="texto-fraco">({drop.bossName})</span><br />
                        Valor: <strong className="texto-sucesso">{formatTibiaGold(drop.totalValue)}</strong>{' '}
                        · {drop.sold ? 'Vendido' : 'Pendente'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDateKey && (
        <Modal title={`Detalhes de ${selectedDateKey}`} onClose={() => setSelectedDateKey(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            {selectedEvents.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-warning)' }}>🚩 Evento oficial</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedEvents.map((ev) => (
                    <div key={ev.id} style={{ background: 'var(--color-warning-soft)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                      <strong style={{ color: 'var(--color-warning)' }}>{ev.name}</strong>
                      <div className="texto-mudo" style={{ fontSize: '12px', margin: '4px 0' }}>
                        {ev.categories.map((cat) => `${EVENT_CATEGORY_ICON[cat]} ${EVENT_CATEGORY_LABEL[cat]}`).join(' · ')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>{ev.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Boss/Hunt: soma de "Cota por Membro" dos splits salvos nesse dia
                (split_logs, ver useSplitLogsDaily) — cada caixa checa o próprio campo
                (null == nenhum split desse tipo salvo nesse dia), independente uma da outra
                (um dia pode ter só Hunt salvo, só Boss, os dois, ou nenhum). */}
            <div className="grid-2col" style={{ gap: '10px' }}>
              <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', display: 'block' }}>Boss (individual)</span>
                  {selectedSplitDaily?.boss != null && (
                    <button
                      type="button"
                      onClick={() => handleHideSplit('boss')}
                      disabled={hidingType === 'boss'}
                      title="Excluir split de Boss desse dia"
                      className="botao-icone-perigo"
                      style={{ fontSize: '12px' }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <strong style={{ color: selectedSplitDaily?.boss != null ? (selectedSplitDaily.boss < 0 ? 'var(--color-danger)' : 'var(--color-success)') : 'var(--color-text-faint)' }}>
                  {selectedSplitDaily?.boss != null ? formatXp(selectedSplitDaily.boss) : 'Sem dado'}
                </strong>
              </div>
              <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', display: 'block' }}>Hunt (individual)</span>
                  {selectedSplitDaily?.hunt != null && (
                    <button
                      type="button"
                      onClick={() => handleHideSplit('hunt')}
                      disabled={hidingType === 'hunt'}
                      title="Excluir split de Hunt desse dia"
                      className="botao-icone-perigo"
                      style={{ fontSize: '12px' }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <strong style={{ color: selectedSplitDaily?.hunt != null ? (selectedSplitDaily.hunt < 0 ? 'var(--color-danger)' : 'var(--color-success)') : 'var(--color-text-faint)' }}>
                  {selectedSplitDaily?.hunt != null ? formatXp(selectedSplitDaily.hunt) : 'Sem dado'}
                </strong>
              </div>
            </div>
            {hideError && <span className="texto-perigo" style={{ fontSize: '12px' }}>⚠ {hideError}</span>}

            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-accent)' }}>XP do dia</h4>
              {selectedXp.length === 0 ? (
                <p className="texto-fraco" style={{ fontSize: '12px', margin: 0 }}>Sem dado de XP pra esse dia.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedXp.map(({ name, value }) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text)' }}>{name}</span>
                      <strong style={{ color: value < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatXp(value)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="texto-sucesso" style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Drops</h4>
              {(selectedActivity?.drops.length ?? 0) === 0 ? (
                <p className="texto-fraco" style={{ fontSize: '12px', margin: 0 }}>Nenhum drop registrado nesse dia.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedActivity!.drops.map((drop) => (
                    <div key={drop.id} style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
                      💎 {drop.itemName} <span className="texto-fraco">({drop.bossName})</span><br />
                      Valor: <strong className="texto-sucesso">{formatTibiaGold(drop.totalValue)}</strong>{' '}
                      · {drop.sold ? 'Vendido' : 'Pendente'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
