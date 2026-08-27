import { formatTibiaGold } from '@/services/split';
import { getItemIconUrl } from '@/services/lootdrop/item-icons';
import type { LootDrop } from '@/types';

const MESES = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

interface MonthDropsCardProps {
  selectedMonth: string;
  selectedYear: string;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  drops: LootDrop[];
  loading: boolean;
  error: string | null;
  onItemClick: (itemName: string) => void;
}

/** Card "Drops no mês" (Coluna 1 do Dashboard) — extraído de DashboardPage.tsx em
 * 2026-08-27 (arquivo tinha passado de 700 linhas, ver memória "componentes-grandes"). Só
 * apresentação: ordenação/filtro dos drops já vêm prontos por props, e o clique numa linha
 * delega pro onItemClick (abre o ItemSummaryModal, que continua sendo chamado só na
 * página, ver [[feedback-modal-arquivo-separado]]). */
export function MonthDropsCard({ selectedMonth, selectedYear, onMonthChange, onYearChange, drops, loading, error, onItemClick }: MonthDropsCardProps) {
  return (
    <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-accent)' }}>Drops no mês</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            style={{ background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '4px 6px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
          >
            {MESES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w60"
            style={{ background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '4px 6px', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '12px' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '6px' }}>
        <span className="texto-mudo" style={{ fontSize: '12px' }}>Vendido / Valor</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {loading && <div className="texto-mudo" style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>Carregando...</div>}
        {error && <div className="texto-perigo" style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>{error}</div>}
        {!loading && !error && drops.length === 0 && (
          <div className="texto-fraco" style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>Nenhum drop encontrado.</div>
        )}
        {!loading && !error && drops.length > 0 && (
          <table className="tabela-simples">
            <tbody>
              {drops.map((drop, idx) => {
                const isSold = drop.sold;
                const rowBg = isSold ? 'var(--color-success-soft)' : 'var(--color-danger-soft)';
                return (
                  <tr
                    key={drop.id || idx}
                    onClick={() => onItemClick(drop.itemName)}
                    title="Ver resumo deste item"
                    style={{ borderBottom: '1px solid var(--color-border)', background: rowBg, cursor: 'pointer' }}
                  >
                    <td className="texto-mudo" style={{ padding: '6px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getItemIconUrl(drop.itemName) && (
                        <img src={getItemIconUrl(drop.itemName)} alt="" className="h18 w18" style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                      )}
                      <span>{drop.itemName || 'Item Raro'}</span>
                    </td>
                    <td className={`w60 ${isSold ? 'texto-sucesso' : 'texto-perigo'}`} style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                      {isSold ? 'Sim' : 'Não'}
                    </td>
                    <td className={`texto-mono w110 ${isSold ? 'texto-sucesso' : 'texto-fraco'}`} style={{ padding: '6px 4px', textAlign: 'right' }}>
                      {isSold ? formatTibiaGold(drop.totalValue) : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
