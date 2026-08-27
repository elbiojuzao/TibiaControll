import { formatTibiaGold } from '@/services/split';
import type { MissingCharacterShare } from '@/services/lootdrop/drop-form-calculations';
import type { TransferInstruction } from '@/types';

interface TransferCommandsPanelProps {
  transferInstructions: TransferInstruction[];
  missingCharacterShares: MissingCharacterShare[];
  defaultSeller: string;
  doneIndices: Set<number>;
  onCopyCommand: (commandText: string, index: number) => void;
}

/** Painel "Copiar Comandos de Transferência" do DropFormModal — extraído em 2026-08-27 pra
 * reduzir o tamanho do componente (ver memória "componentes-grandes"). Só apresentação: os
 * comandos já vêm calculados por props (computeTransferInstructions, no componente pai);
 * o estado de "já copiado" (doneIndices) continua lá, só o clique dispara onCopyCommand. */
export function TransferCommandsPanel({ transferInstructions, missingCharacterShares, defaultSeller, doneIndices, onCopyCommand }: TransferCommandsPanelProps) {
  return (
    <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '14px' }}>
      <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--color-text)' }}>Copiar Comandos de Transferência:</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {transferInstructions.map((t, idx) => (
          <div
            key={`cmd-${idx}`}
            style={{
              background: 'var(--color-bg-elevated)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div>
              <div className="texto-mudo" style={{ fontSize: '11px' }}>
                <span className="texto-perigo" style={{ fontWeight: 'bold' }}>{t.from}</span> paga para{' '}
                <span className="texto-sucesso" style={{ fontWeight: 'bold' }}>{t.to}</span>
              </div>
              <div className="texto-mono" style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '2px' }}>
                {t.tibiaCommand}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCopyCommand(t.tibiaCommand, idx)}
              title={doneIndices.has(idx) ? 'Já copiado — clique pra copiar de novo' : 'Copiar comando'}
              style={{
                background: doneIndices.has(idx) ? 'var(--color-success)' : 'var(--color-border)',
                color: doneIndices.has(idx) ? 'var(--color-bg)' : 'var(--color-text)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background 0.2s',
                minWidth: '65px',
              }}
            >
              {doneIndices.has(idx) ? '✓ Pago' : 'Copiar'}
            </button>
          </div>
        ))}
        {missingCharacterShares.map((m, idx) => (
          <div
            key={`missing-${idx}`}
            style={{
              background: 'var(--color-bg-elevated)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-warning)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div>
              <div className="texto-mudo" style={{ fontSize: '11px' }}>
                <span className="texto-perigo" style={{ fontWeight: 'bold' }}>{defaultSeller}</span> deve pagar{' '}
                <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>{m.serviceiroName}</span>
              </div>
              <div className="texto-mono" style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '2px' }}>
                {formatTibiaGold(m.amount)}
              </div>
            </div>
            <span
              title="Sem 'Boneco' cadastrado em Serviceiros — não dá pra gerar o comando transfer. Combine o pagamento por fora."
              style={{
                color: 'var(--color-warning)',
                border: '1px solid var(--color-warning)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              ⚠ Sem Boneco
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
