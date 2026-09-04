import { useState } from 'react';
import { useSplitLogsList } from '@/hooks/useSplitLogsList';
import { formatTibiaGold } from '@/services/split';
import { SplitDetailModal } from '@/modules/calendar-historico/components/SplitDetailModal';
import type { SplitLog } from '@/types';

const RECENT_COUNT = 10;

/** "Sessões recentes" — pedido do usuário (2026-09-04, a partir de um print de app
 * concorrente que junta a calculadora com uma lista de sessões recentes na mesma tela, em
 * vez de precisar ir no Histórico de Splits pra ver o que já foi salvo). Reusa
 * `useSplitLogsList` (mesmo hook do Histórico) e `SplitDetailModal` (mesma modal de
 * detalhe) sem duplicar nada — só filtra/ordena os N mais recentes por `createdAt`.
 *
 * **Vira cards + sem excluir (2026-09-04, refinamento seguinte, pedido do usuário)** — era
 * uma lista de linhas com 🗑️ por linha; agora são cards (mesmo padrão visual dos cards de
 * Serviceiros) e o botão de excluir sumiu daqui e da modal de detalhe aberta a partir
 * daqui (`allowDelete={false}`) — é um atalho de CONSULTA rápida, quem quiser excluir de
 * verdade usa o Histórico de Splits completo (SplitsHistoricoPage.tsx), onde o botão
 * continua normal. Também subiu de 6 pra 10 cards. */
export function RecentSplitsList({ accountId }: { accountId: string }) {
  const { splitLogs, loading } = useSplitLogsList(accountId);
  const [selected, setSelected] = useState<SplitLog | null>(null);

  const recent = [...splitLogs]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, RECENT_COUNT);

  if (loading) return null;

  return (
    <div className="card-compacto" style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: 'var(--color-warning)' }}>Sessões recentes</h3>
      {recent.length === 0 ? (
        <p className="estado-vazio">Nenhum split salvo ainda.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          {recent.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelected(log)}
              className="card-compacto"
              style={{
                padding: '12px 10px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', textAlign: 'center', gap: '4px', cursor: 'pointer',
              }}
            >
              <strong style={{ fontSize: '13px' }}>{log.type === 'boss' ? '🐲 Boss' : '🗡️ Hunt'}</strong>
              <span className="texto-fraco" style={{ fontSize: '11px' }}>{log.date}</span>
              <strong className="texto-sucesso" style={{ fontSize: '13px' }}>{formatTibiaGold(log.equalShare)}</strong>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <SplitDetailModal
          log={selected}
          onClose={() => setSelected(null)}
          allowDelete={false}
        />
      )}
    </div>
  );
}
