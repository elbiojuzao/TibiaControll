import { useMemo } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useMembers } from '@/hooks/useMembers';
import { useXpSheet } from '@/hooks/useXpSheet';
import { parseDateKey } from '@/services/calendar';

function formatXp(value: number): string {
  const sign = value < 0 ? '-' : '+';
  return sign + Math.abs(value).toLocaleString('pt-BR');
}

const DAYS = 30;

export function XpHistoricoPage() {
  const { accountId } = useAccount();
  const { members } = useMembers(accountId);
  const { data, loading, error } = useXpSheet();

  const valueMaps = useMemo(() => {
    const maps: Record<string, Map<string, number>> = {};
    for (const [name, stats] of Object.entries(data)) {
      maps[name] = new Map(stats.series.map((e) => [e.date, e.value]));
    }
    return maps;
  }, [data]);

  // Últimos 30 dias com dado em qualquer personagem — não assume que todos batem
  // exatamente a mesma data (a rotina do usuário podia ter falhado num dia pra um char só).
  const last30Dates = useMemo(() => {
    const allDates = new Set<string>();
    for (const stats of Object.values(data)) {
      for (const entry of stats.series) allDates.add(entry.date);
    }
    return Array.from(allDates)
      .sort((a, b) => parseDateKey(b) - parseDateKey(a))
      .slice(0, DAYS);
  }, [data]);

  const columnNames = members.length > 0 ? members.map((m) => m.characterName) : Object.keys(data);

  const totalsByCharacter = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const name of columnNames) {
      totals[name] = last30Dates.reduce((sum, date) => sum + (valueMaps[name]?.get(date) ?? 0), 0);
    }
    return totals;
  }, [columnNames, last30Dates, valueMaps]);

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', color: 'var(--color-text)' }}>
      <header className="page-header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-success)' }}>Histórico de XP</h2>
        <p style={{ margin: '5px 0 0 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          XP feita por cada jogador nos últimos {DAYS} dias, lido ao vivo da planilha.
        </p>
      </header>

      <div className="card" style={{ background: 'var(--color-bg-elevated)', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
        {loading && <div className="loading">Carregando...</div>}
        {error && <div className="empty-state">{error}</div>}
        {!loading && !error && last30Dates.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--color-text-faint)', textAlign: 'center', margin: '20px 0' }}>
            Nenhum dado de XP encontrado na planilha.
          </p>
        )}

        {!loading && !error && last30Dates.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px' }}>Dia</th>
                  {columnNames.map((name) => (
                    <th key={name} style={{ textAlign: 'right', padding: '6px' }}>{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {last30Dates.map((date) => (
                  <tr key={date} style={{ borderBottom: '1px solid var(--color-bg-elevated)' }}>
                    <td style={{ padding: '6px', color: 'var(--color-text)' }}>{date}</td>
                    {columnNames.map((name) => {
                      const value = valueMaps[name]?.get(date);
                      return (
                        <td
                          key={name}
                          style={{ padding: '6px', textAlign: 'right', color: value === undefined ? 'var(--color-text-faint)' : value < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}
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
                  <td style={{ padding: '6px', color: 'var(--color-text)' }}>Total ({DAYS}d)</td>
                  {columnNames.map((name) => (
                    <td key={name} style={{ padding: '6px', textAlign: 'right', color: 'var(--color-accent)' }}>
                      {formatXp(totalsByCharacter[name] ?? 0)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
