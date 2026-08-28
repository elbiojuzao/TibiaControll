import { useMemo, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useMembers } from '@/hooks/useMembers';
import { useXpSheet } from '@/hooks/useXpSheet';
import { parseDateKey } from '@/services/calendar';
import { MESES } from '@/services/common/months';

function formatXp(value: number): string {
  const sign = value < 0 ? '-' : '+';
  return sign + Math.abs(value).toLocaleString('pt-BR');
}

// Janela do pódio de recorde é fixa em 365 dias; a tabela dia-a-dia é filtrável no
// front (pedido do usuário em 2026-08-17) — o hook já traz o histórico completo da
// planilha (ver useXpSheet), então trocar de janela não dispara requisição nova.
const RECORD_WINDOW_DAYS = 365;
const WINDOW_OPTIONS = [30, 60, 90, 120, 365];
const PODIUM_COLORS = ['var(--color-warning)', 'var(--color-text-muted)', '#b45309'];

interface RecordEntry {
  date: string;
  value: number;
}

/** DD/MM/YYYY -> "Agosto/2026". Mês CALENDÁRIO de verdade (dia 1 ao último dia do mês),
 * não uma janela corrida de 30 dias — correção pedida pelo usuário em 2026-08-17: "não é
 * um podium dos ultimos 30 e sim... sempre no primeiro dia do mes e termina no final do
 * mes". */
function monthLabelFromBrDate(date: string): string {
  const [, mm, yyyy] = date.split('/');
  return `${MESES[Number(mm) - 1].label}/${yyyy}`;
}

interface PodiumItem {
  name: string;
  valueLabel: string;
  /** Data do dia (pódio de recorde de 1 dia) ou mês/ano (pódio de melhor mês) do valor mostrado */
  subLabel?: string;
}

/** Pódio genérico (2026-08-17, pedido do usuário: "poderia ser um podium... igual de
 * olimpiadas e campeonatos" — degraus decrescentes por POSIÇÃO, não por valor, tipo
 * pódio de verdade). Reusado pro recorde de 1 dia e pra soma de 30 dias. */
function Podium({ items }: { items: PodiumItem[] }) {
  if (items.length === 0) return <p className="estado-vazio">Nenhum dado encontrado.</p>;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', paddingTop: '24px', overflowX: 'auto' }}>
      {items.map((item, idx) => {
        const rank = idx + 1;
        const height = Math.max(46, 150 - idx * 22);
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}º`;
        const barColor = PODIUM_COLORS[idx] ?? 'var(--color-border)';
        return (
          <div key={item.name} className="w110" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span style={{ fontSize: rank <= 3 ? '24px' : '14px', fontWeight: 'bold' }}>{medal}</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text)', textAlign: 'center' }}>{item.name}</span>
            <span className="texto-sucesso" style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.valueLabel}</span>
            {item.subLabel && <span className="texto-fraco" style={{ fontSize: '11px' }}>{item.subLabel}</span>}
            <div
              style={{
                width: '100%', height: `${height}px`, background: barColor,
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '6px',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-bg)' }}>{rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function XpHistoricoPage() {
  const { accountId } = useAccount();
  const { members } = useMembers(accountId);
  const { data, loading, error } = useXpSheet();
  const [windowDays, setWindowDays] = useState(30);

  const valueMaps = useMemo(() => {
    const maps: Record<string, Map<string, number>> = {};
    for (const [name, stats] of Object.entries(data)) {
      maps[name] = new Map(stats.series.map((e) => [e.date, e.value]));
    }
    return maps;
  }, [data]);

  // Datas com dado em qualquer personagem, mais recente primeiro — não assume que
  // todos batem exatamente a mesma data (a rotina do usuário podia ter falhado num
  // dia pra um char só).
  const allDates = useMemo(() => {
    const dates = new Set<string>();
    for (const stats of Object.values(data)) {
      for (const entry of stats.series) dates.add(entry.date);
    }
    return Array.from(dates).sort((a, b) => parseDateKey(b) - parseDateKey(a));
  }, [data]);

  const windowDates = useMemo(() => allDates.slice(0, windowDays), [allDates, windowDays]);
  const recordWindowDatesSet = useMemo(() => new Set(allDates.slice(0, RECORD_WINDOW_DAYS)), [allDates]);

  const columnNames = members.length > 0 ? members.map((m) => m.characterName) : Object.keys(data);

  const totalsByCharacter = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const name of columnNames) {
      totals[name] = windowDates.reduce((sum, date) => sum + (valueMaps[name]?.get(date) ?? 0), 0);
    }
    return totals;
  }, [columnNames, windowDates, valueMaps]);

  // Recorde de maior XP num único dia, só dos últimos 365 dias (2026-08-17, pedido do
  // usuário: simplificar pra 1 janela só) — ranqueado do maior pro menor pra virar pódio.
  const podiumEntries = useMemo(() => {
    const entries: (RecordEntry & { name: string })[] = [];
    for (const name of columnNames) {
      const series = data[name]?.series ?? [];
      let best: RecordEntry | undefined;
      for (const entry of series) {
        if (recordWindowDatesSet.has(entry.date) && (!best || entry.value > best.value)) best = entry;
      }
      if (best) entries.push({ name, ...best });
    }
    return entries.sort((a, b) => b.value - a.value);
  }, [columnNames, data, recordWindowDatesSet]);

  // Pódio do MELHOR MÊS de cada personagem (2026-08-17, corrigido no mesmo dia — não é
  // janela corrida de 30 dias, é soma por mês calendário real, dia 1 ao último dia do
  // mês). Pra cada personagem, agrupa toda a série por "YYYY-MM" e acha o mês com maior
  // soma; ranqueia os personagens pelo valor desse melhor mês, mostrando qual mês foi.
  const monthPodiumEntries = useMemo(() => {
    const entries: { name: string; monthLabel: string; value: number }[] = [];
    for (const name of columnNames) {
      const series = data[name]?.series ?? [];
      const totalsByMonth = new Map<string, { value: number; sampleDate: string }>();
      for (const entry of series) {
        const [, mm, yyyy] = entry.date.split('/');
        const monthKey = `${yyyy}-${mm}`;
        const current = totalsByMonth.get(monthKey);
        totalsByMonth.set(monthKey, { value: (current?.value ?? 0) + entry.value, sampleDate: entry.date });
      }
      let best: { monthKey: string; value: number; sampleDate: string } | undefined;
      for (const [monthKey, { value, sampleDate }] of totalsByMonth) {
        if (!best || value > best.value) best = { monthKey, value, sampleDate };
      }
      if (best) entries.push({ name, monthLabel: monthLabelFromBrDate(best.sampleDate), value: best.value });
    }
    return entries.sort((a, b) => b.value - a.value);
  }, [columnNames, data]);

  return (
    <>
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card-compacto">
          <h3 style={{ fontSize: '14px', margin: '0 0 4px 0', color: 'var(--color-warning)' }}>🏆 Recorde de XP num dia — últimos 365 dias</h3>
          {loading ? <div className="loading">Carregando...</div> : error ? <div className="empty-state">{error}</div> : (
            <Podium items={podiumEntries.map((e) => ({ name: e.name, valueLabel: formatXp(e.value), subLabel: e.date }))} />
          )}
        </div>

        <div className="card-compacto">
          <h3 style={{ fontSize: '14px', margin: '0 0 4px 0', color: 'var(--color-accent)' }}>🏆 Melhor mês de XP</h3>
          {loading ? <div className="loading">Carregando...</div> : error ? <div className="empty-state">{error}</div> : (
            <Podium items={monthPodiumEntries.map((e) => ({ name: e.name, valueLabel: formatXp(e.value), subLabel: e.monthLabel }))} />
          )}
        </div>
      </div>

      <div className="card-compacto">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <span className="texto-mudo" style={{ fontSize: '12px' }}>Ver últimos:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setWindowDays(opt)}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                  border: windowDays === opt ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: windowDays === opt ? 'var(--color-accent-soft)' : 'var(--color-bg-input)',
                  color: windowDays === opt ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {opt}d
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="loading">Carregando...</div>}
        {error && <div className="empty-state">{error}</div>}
        {!loading && !error && windowDates.length === 0 && (
          <p className="estado-vazio">
            Nenhum dado de XP encontrado na planilha.
          </p>
        )}

        {!loading && !error && windowDates.length > 0 && (
          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table className="tabela-simples">
              <thead>
                <tr className="texto-mudo" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="celula-esq">Dia</th>
                  {columnNames.map((name) => (
                    <th key={name} className="celula-dir">{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {windowDates.map((date) => (
                  <tr key={date} style={{ borderBottom: '1px solid var(--color-bg-elevated)' }}>
                    <td className="celula-esq" style={{ color: 'var(--color-text)' }}>{date}</td>
                    {columnNames.map((name) => {
                      const value = valueMaps[name]?.get(date);
                      return (
                        <td
                          key={name}
                          className="celula-dir"
                          style={{ color: value === undefined ? 'var(--color-text-faint)' : value < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}
                        >
                          {value === undefined ? '—' : formatXp(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 'bold' }}>
                  <td className="celula-esq" style={{ color: 'var(--color-text)' }}>Total ({windowDays}d)</td>
                  {columnNames.map((name) => (
                    <td key={name} className="celula-dir" style={{ color: 'var(--color-accent)' }}>
                      {formatXp(totalsByCharacter[name] ?? 0)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
