import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { formatTibiaGold } from '@/services/split';
import type { SplitLog } from '@/types';

/** Modal de detalhes de um split salvo (2026-08-23, pedido do usuário: "ao clicar na linha
 * seria interessante abrir uma modal com as informações mais aprofundadas") — tudo que saiu
 * da tabela resumida do SplitsHistoricoPage (Balance Total/Dano Total/Cura Total) mais o
 * detalhe por jogador (Loot/Supplies/Balance/Dano/Cura), as transferências calculadas e o
 * log bruto colado, pra quem quiser conferir/reprocessar. Não busca nada novo — o `SplitLog`
 * já vem inteiro do useSplitLogsList e é passado inteiro por prop.
 *
 * **Coluna "Balance Ajustado" nunca entrou aqui** (pedido do usuário no mesmo dia da
 * criação: "não deveria existir... não vale muito a pena ter nessa tela") — `m.balance`
 * (bruto do log) já é o que importa aqui; o ajuste por Gastos Extras/Cotação TC só faz
 * sentido no contexto AO VIVO da Calculadora (onde o usuário está digitando os extras
 * daquele split específico), não numa tela de histórico read-only.
 *
 * Extraído de SplitsHistoricoPage.tsx em 2026-08-27 seguindo a regra "modal em arquivo
 * separado" (ver memória feedback-modal-arquivo-separado) — antes estava definida como
 * função-componente inline dentro do arquivo da página. */
export function SplitDetailModal({
  log,
  onClose,
  onDelete,
  deleteError,
}: {
  log: SplitLog;
  onClose: () => void;
  onDelete: () => void;
  deleteError: string | null;
}) {
  const [copiedIndices, setCopiedIndices] = useState<Set<number>>(new Set());
  const [showRawLog, setShowRawLog] = useState(false);

  const handleCopy = (commandText: string, idx: number) => {
    navigator.clipboard.writeText(commandText);
    setCopiedIndices((prev) => new Set(prev).add(idx));
  };

  return (
    <Modal title={`${log.type === 'boss' ? '🐲 Boss' : '🗡️ Hunt'} — ${log.date}`} onClose={onClose} maxWidth={680}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
        {deleteError && <span className="texto-perigo" style={{ fontSize: '12px' }}>⚠ {deleteError}</span>}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
          <div className="grid-2col" style={{ gap: '10px', flex: 1 }}>
            <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', display: 'block' }}>Balance Total</span>
              <strong className="texto-sucesso">{formatTibiaGold(log.totalBalance)}</strong>
            </div>
            <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', display: 'block' }}>Cota por Membro</span>
              <strong style={{ color: 'var(--color-accent)' }}>{formatTibiaGold(log.equalShare)}</strong>
            </div>
          </div>
          <button type="button" onClick={onDelete} title="Excluir este split (soft delete)" className="botao-icone">
            🗑️
          </button>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text)' }}>Detalhe por jogador</h4>
          <div className="loot-table-wrapper">
            <table className="loot-table" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Loot</th>
                  <th>Supplies</th>
                  <th>Balance</th>
                  <th>Dano</th>
                  <th>Cura</th>
                </tr>
              </thead>
              <tbody>
                {log.members.map((m) => (
                  <tr key={m.name}>
                    <td>{m.name}</td>
                    <td className="col-gold positive">{formatTibiaGold(m.loot)}</td>
                    <td>{formatTibiaGold(m.supplies)}</td>
                    <td className="col-gold positive">{formatTibiaGold(m.balance)}</td>
                    <td>{m.damage.toLocaleString('pt-BR')}</td>
                    <td>{m.healing.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text)' }}>Transferências</h4>
          {log.transfers.length === 0 ? (
            <p className="texto-fraco" style={{ fontSize: '12px', margin: 0 }}>Nenhuma transferência necessária.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {log.transfers.map((t, idx) => (
                <div key={idx} style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="texto-mudo" style={{ fontSize: '11px' }}>
                      <span className="texto-perigo" style={{ fontWeight: 'bold' }}>{t.from}</span> paga para <span className="texto-sucesso" style={{ fontWeight: 'bold' }}>{t.to}</span>
                    </div>
                    <div className="texto-mono" style={{ fontSize: '12px', marginTop: '2px' }}>{t.commandText}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(t.commandText, idx)}
                    style={{
                      background: copiedIndices.has(idx) ? 'var(--color-success)' : 'var(--color-border)',
                      color: copiedIndices.has(idx) ? 'var(--color-bg)' : 'var(--color-text)',
                      border: 'none', padding: '5px 10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', minWidth: '60px',
                    }}
                  >
                    {copiedIndices.has(idx) ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowRawLog((v) => !v)}
            className="botao-secundario"
            style={{ fontSize: '12px', padding: '5px 12px' }}
          >
            {showRawLog ? '▲ Esconder log bruto' : '▼ Ver log bruto colado'}
          </button>
          {showRawLog && (
            <pre className="texto-mono" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px', fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {log.rawLog}
            </pre>
          )}
        </div>
      </div>
    </Modal>
  );
}
