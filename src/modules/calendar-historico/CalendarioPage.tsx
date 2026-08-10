import { useEffect, useMemo, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useHunts } from '@/hooks/useHunts';
import { useLootDrops } from '@/hooks/useLootDrops';
import { useMembers } from '@/hooks/useMembers';
import { useXpSheet } from '@/hooks/useXpSheet';
import { useBossHuntSheet } from '@/hooks/useBossHuntSheet';
import { Modal } from '@/components/common/Modal';
import { formatTibiaGold } from '@/services/split';
import { formatDateKey, findLatestActivityDate, groupActivityByDate } from '@/services/calendar';

function formatXp(value: number): string {
  const sign = value < 0 ? '-' : '+';
  return sign + Math.abs(value).toLocaleString('pt-BR');
}

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
  const { series: bossHuntSeries } = useBossHuntSheet();

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
  const selectedBossHunt = selectedDateKey ? bossHuntSeries.find((e) => e.date === selectedDateKey) : undefined;

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

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', color: '#f8fafc' }}>
      <header className="page-header" style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#10b981' }}>Histórico — Calendário</h2>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
          Passe o mouse num dia pra um resumo rápido, ou clique pra abrir os detalhes completos (drops, hunts e XP por jogador).
        </p>
      </header>

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
          <span className="calendar-legend-item"><span className="calendar-dot boss" /> Boss (teve valor na planilha)</span>
          <span className="calendar-legend-item"><span className="calendar-dot hunt" /> Hunt (teve valor na planilha)</span>
          <span className="calendar-legend-item"><span className="calendar-dot drop" /> Item — 1 bolinha por drop no dia</span>
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
            // "Teve valor adicionado nesse dia" — a leitura da planilha (useBossHuntSheet) só
            // inclui uma linha se a célula de Hunt daquele dia não estiver em branco, então a
            // simples existência da entrada já basta pro dot de Hunt. Pra Boss não tem esse
            // mesmo filtro no fetch (ver api/_lib/boss-hunt-sheet.ts), então uma célula de Boss
            // em branco vira 0 igual um lucro genuinamente zerado — usamos "!== 0" como
            // aproximação (não distingue perfeitamente "sem dado" de "zerado de verdade").
            const bossHuntEntry = bossHuntSeries.find((e) => e.date === cell.dateKey);
            const hasBoss = bossHuntEntry !== undefined && bossHuntEntry.boss !== 0;
            const hasHunt = bossHuntEntry !== undefined;
            const hasActivity = !!activity && (activity.hunts.length > 0 || activity.drops.length > 0);
            const hasAnyIndicator = hasActivity || hasBoss || hasHunt;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDateKey(cell.dateKey)}
                title="Clique para ver os detalhes do dia"
                className={`calendar-day${hasAnyIndicator ? ' has-activity' : ''}${cell.dateKey === todayKey ? ' today' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <span className="calendar-day-number">{cell.day}</span>

                {hasAnyIndicator && (
                  <div className="calendar-day-dots">
                    {hasBoss && <span className="calendar-dot boss" title="Boss" />}
                    {hasHunt && <span className="calendar-dot hunt" title="Hunt" />}
                    {activity?.drops.map((drop) => (
                      <span key={drop.id} className="calendar-dot drop" title={drop.itemName} />
                    ))}
                  </div>
                )}

                {hasAnyIndicator && (
                  <div className="calendar-tooltip">
                    <div className="calendar-tooltip-title">{cell.dateKey}</div>

                    {(hasBoss || hasHunt) && (
                      <div className="calendar-tooltip-item">
                        {hasBoss && <>🐲 Boss: <strong style={{ color: '#38bdf8' }}>{formatXp(bossHuntEntry!.boss)}</strong><br /></>}
                        {hasHunt && <>🗡️ Hunt: <strong style={{ color: '#f59e0b' }}>{formatXp(bossHuntEntry!.hunt)}</strong></>}
                      </div>
                    )}

                    {activity?.hunts.map((hunt) => (
                      <div key={hunt.id} className="calendar-tooltip-item">
                        🗡️ Hunt{hunt.bossName ? ` — ${hunt.bossName}` : ''}<br />
                        Profit: <strong style={{ color: '#10b981' }}>{formatTibiaGold(hunt.profitTotal)}</strong>{' '}
                        · XP: <strong>{hunt.xpGained.toLocaleString('pt-BR')}</strong>
                      </div>
                    ))}

                    {activity?.drops.map((drop) => (
                      <div key={drop.id} className="calendar-tooltip-item">
                        💎 {drop.itemName} <span style={{ color: '#64748b' }}>({drop.bossName})</span><br />
                        Valor: <strong style={{ color: '#10b981' }}>{formatTibiaGold(drop.totalValue)}</strong>{' '}
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
            {/* Boss/Hunt: profit individual do dia, lido da aba "Boss hunt" da planilha
                (já vem dividido — /4 hunt, /5 boss — ver useBossHuntSheet). */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '10px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Boss (individual)</span>
                <strong style={{ color: selectedBossHunt ? (selectedBossHunt.boss < 0 ? '#ef4444' : '#10b981') : '#64748b' }}>
                  {selectedBossHunt ? formatXp(selectedBossHunt.boss) : 'Sem dado'}
                </strong>
              </div>
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '10px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Hunt (individual)</span>
                <strong style={{ color: selectedBossHunt ? (selectedBossHunt.hunt < 0 ? '#ef4444' : '#10b981') : '#64748b' }}>
                  {selectedBossHunt ? formatXp(selectedBossHunt.hunt) : 'Sem dado'}
                </strong>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#38bdf8' }}>XP do dia</h4>
              {selectedXp.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Sem dado de XP pra esse dia.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedXp.map(({ name, value }) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#f8fafc' }}>{name}</span>
                      <strong style={{ color: value < 0 ? '#ef4444' : '#10b981' }}>{formatXp(value)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#10b981' }}>Drops</h4>
              {(selectedActivity?.drops.length ?? 0) === 0 ? (
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Nenhum drop registrado nesse dia.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedActivity!.drops.map((drop) => (
                    <div key={drop.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px' }}>
                      💎 {drop.itemName} <span style={{ color: '#64748b' }}>({drop.bossName})</span><br />
                      Valor: <strong style={{ color: '#10b981' }}>{formatTibiaGold(drop.totalValue)}</strong>{' '}
                      · {drop.sold ? 'Vendido' : 'Pendente'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
