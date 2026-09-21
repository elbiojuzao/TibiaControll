import { useState } from 'react';
import type { MissingCharacterShare } from '@/services/lootdrop/drop-form-calculations';
import type { TransferInstruction } from '@/types';

interface CoinPayoutPanelProps {
  /** Mesma estrutura dos comandos de transferência em gold — `amount` aqui já está em COINS
   * (computeTransferInstructions chamado com o Valor Cada em coins). `to` é o char que
   * recebe (boneco do serviceiro, quando for o caso), o nome que se cola no jogo. */
  instructions: TransferInstruction[];
  missingCharacterShares: MissingCharacterShare[];
  defaultSeller: string;
}

const copyButtonStyle = (done: boolean) => ({
  background: done ? 'var(--color-success)' : 'var(--color-border)',
  color: done ? 'var(--color-bg)' : 'var(--color-text)',
  border: 'none',
  padding: '5px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '11px',
  fontWeight: 'bold' as const,
  cursor: 'pointer',
  transition: 'background 0.2s',
  whiteSpace: 'nowrap' as const,
});

/** Painel "Pagamento em coins" do DropFormModal (2026-09-21, pedido do usuário: "aparecer o
 * valor cada (em coins) ... e também os nomes dos participantes ... para poder copiar").
 * Uma linha por participante que recebe (o vendedor, que já está com as coins, fica de
 * fora): botão pra copiar o NOME (o char, pra colar no campo de destinatário) e outro pra
 * copiar a QUANTIDADE de coins. Só apresentação — a divisão vem calculada por props; o
 * estado de "já copiado" é local (só feedback visual, não é dado que se perde). */
export function CoinPayoutPanel({ instructions, missingCharacterShares, defaultSeller }: CoinPayoutPanelProps) {
  const [copied, setCopied] = useState<Set<string>>(new Set());

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied((prev) => new Set(prev).add(key));
  };

  const rowStyle = {
    background: 'var(--color-bg-elevated)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap' as const,
  };

  return (
    <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '14px' }}>
      <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--color-text)' }}>Pagamento em coins — {defaultSeller} paga:</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {instructions.map((t, idx) => (
          <div key={`coin-${idx}`} style={{ ...rowStyle, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="texto-sucesso" style={{ fontWeight: 'bold', fontSize: '13px' }}>{t.to}</span>
              <button type="button" onClick={() => copy(t.to, `name-${idx}`)} title="Copiar nome" style={copyButtonStyle(copied.has(`name-${idx}`))}>
                {copied.has(`name-${idx}`) ? '✓ Nome' : 'Copiar nome'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="texto-mono" style={{ fontSize: '13px', color: 'var(--color-text)' }}>{t.amount.toLocaleString('pt-BR')} coins</span>
              <button type="button" onClick={() => copy(String(t.amount), `amount-${idx}`)} title="Copiar quantidade de coins" style={copyButtonStyle(copied.has(`amount-${idx}`))}>
                {copied.has(`amount-${idx}`) ? '✓ Valor' : 'Copiar valor'}
              </button>
            </div>
          </div>
        ))}
        {missingCharacterShares.map((m, idx) => (
          <div key={`coin-missing-${idx}`} style={{ ...rowStyle, border: '1px solid var(--color-warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--color-warning)', fontWeight: 'bold', fontSize: '13px' }}>{m.serviceiroName}</span>
              <span
                title="Sem 'Boneco' cadastrado em Serviceiros — não dá pra copiar o nome do char. Combine o pagamento por fora."
                style={{ color: 'var(--color-warning)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-sm)', padding: '3px 8px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                ⚠ Sem Boneco
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="texto-mono" style={{ fontSize: '13px', color: 'var(--color-text)' }}>{m.amount.toLocaleString('pt-BR')} coins</span>
              <button type="button" onClick={() => copy(String(m.amount), `missing-${idx}`)} title="Copiar quantidade de coins" style={copyButtonStyle(copied.has(`missing-${idx}`))}>
                {copied.has(`missing-${idx}`) ? '✓ Valor' : 'Copiar valor'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
