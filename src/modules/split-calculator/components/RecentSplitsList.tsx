import { useState } from 'react';
import { useSplitLogsList } from '@/hooks/useSplitLogsList';
import { formatTibiaGold } from '@/services/split';
import { SplitDetailModal } from '@/modules/calendar-historico/components/SplitDetailModal';
import type { SplitLog } from '@/types';

const RECENT_COUNT = 6;

/** "Sessões recentes" — pedido do usuário (2026-09-04, a partir de um print de app
 * concorrente que junta a calculadora com uma lista de sessões recentes na mesma tela, em
 * vez de precisar ir no Histórico de Splits pra ver o que já foi salvo). Reusa
 * `useSplitLogsList` (mesmo hook do Histórico) e `SplitDetailModal` (mesma modal de
 * detalhe) sem duplicar nada — só filtra/ordena os N mais recentes por `createdAt`. */
export function RecentSplitsList({ accountId }: { accountId: string }) {
  const { splitLogs, loading, hideSplit } = useSplitLogsList(accountId);
  const [selected, setSelected] = useState<SplitLog | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const recent = [...splitLogs]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, RECENT_COUNT);

  const handleDelete = async (log: SplitLog) => {
    if (!window.confirm(`Excluir o split de ${log.type === 'boss' ? 'Boss' : 'Hunt'} do dia ${log.date}? Essa ação não pode ser desfeita por aqui.`)) return;
    setDeleteError(null);
    try {
      await hideSplit(log.id);
      if (selected?.id === log.id) setSelected(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir split.');
    }
  };

  if (loading) return null;

  return (
    <div className="card-compacto" style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: 'var(--color-warning)' }}>Sessões recentes</h3>
      {deleteError && <p className="texto-perigo" style={{ fontSize: '12px', margin: '0 0 10px 0' }}>⚠ {deleteError}</p>}
      {recent.length === 0 ? (
        <p className="estado-vazio">Nenhum split salvo ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recent.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelected(log)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', padding: '10px 12px', cursor: 'pointer',
              }}
            >
              <div>
                <strong style={{ fontSize: '13px' }}>{log.type === 'boss' ? '🐲 Boss' : '🗡️ Hunt'}</strong>
                <span className="texto-fraco" style={{ fontSize: '12px', marginLeft: '8px' }}>{log.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <strong className="texto-sucesso" style={{ fontSize: '13px' }}>{formatTibiaGold(log.equalShare)}</strong>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(log); }}
                  className="botao-icone-perigo"
                  title="Excluir este split"
                  style={{ fontSize: '13px' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <SplitDetailModal
          log={selected}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected)}
          deleteError={deleteError}
        />
      )}
    </div>
  );
}
