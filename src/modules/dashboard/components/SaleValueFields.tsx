import { useState } from 'react';
import { formatTibiaGold } from '@/services/split';

export type SaleValueMode = 'kk' | 'coins';

interface TotalValueFieldProps {
  mode: SaleValueMode;
  onToggleMode: () => void;
  totalValue: string;
  onTotalValueChange: (value: string) => void;
  /** Total já calculado (valor da coin × coins vendidas) — só exibido no modo coins. */
  coinTotal: number;
  coinValue: string;
  onCoinValueChange: (value: string) => void;
  saleCoins: string;
  onSaleCoinsChange: (value: string) => void;
}

/** Coluna "Valor Total" do DropFormModal com o alternador kk <-> coins na linha do título
 * (2026-09-21, pedido do usuário). No modo kk é o input de sempre (gold digitado direto);
 * no modo coins o campo vira um display somente-leitura com o total calculado e, logo
 * abaixo dele, aparecem dois campos curtos — "Valor da coin" (cotação em gold no dia) e
 * "Venda em coins" (quantas coins o item foi vendido); ambos costumam ter até 5 dígitos.
 * O valor que vai pro banco (`valor_total`) continua sempre em gold. Só apresentação: o
 * estado e o cálculo (computeCoinSaleTotal) ficam no DropFormModal. */
export function TotalValueField({
  mode, onToggleMode, totalValue, onTotalValueChange, coinTotal,
  coinValue, onCoinValueChange, saleCoins, onSaleCoinsChange,
}: TotalValueFieldProps) {
  return (
    <div className="label-padrao">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <label htmlFor="drop-total-value">Valor Total:</label>
        <button
          type="button"
          onClick={onToggleMode}
          className="botao-secundario"
          title={mode === 'kk' ? 'Trocar para venda em coins' : 'Trocar para venda em kk'}
          style={{ padding: '1px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
        >
          {mode === 'kk' ? 'kk' : 'coins'} ⇅
        </button>
      </div>

      {mode === 'kk' ? (
        <input
          id="drop-total-value"
          type="number"
          min={0}
          value={totalValue}
          onChange={(e) => onTotalValueChange(e.target.value)}
          placeholder="0"
          className="campo-input"
        />
      ) : (
        <>
          <div
            id="drop-total-value"
            className="campo-input"
            style={{ color: 'var(--color-text-muted)', cursor: 'default' }}
            title="Calculado: valor da coin × coins vendidas"
          >
            {formatTibiaGold(coinTotal)}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <label className="label-padrao" style={{ flex: 1, minWidth: 0 }}>
              Valor da coin:
              <input type="number" min={0} value={coinValue} onChange={(e) => onCoinValueChange(e.target.value)} placeholder="45000" className="campo-input" />
            </label>
            <label className="label-padrao" style={{ flex: 1, minWidth: 0 }}>
              Venda em coins:
              <input type="number" min={0} value={saleCoins} onChange={(e) => onSaleCoinsChange(e.target.value)} placeholder="0" className="campo-input" />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

interface CoinUnitValueFieldProps {
  unitCoins: number;
  playerCount: number;
}

/** "Valor Cada (coins)" (2026-09-21, pedido do usuário) — só no modo coins, logo abaixo do
 * "Valor Cada (calculado)" em gold. Somente-leitura, com botão pra copiar o número puro (sem
 * separador de milhar) e colar direto no campo de valor da transferência de coins do jogo. */
export function CoinUnitValueField({ unitCoins, playerCount }: CoinUnitValueFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(unitCoins));
    setCopied(true);
  };

  return (
    <div className="label-padrao" style={{ marginTop: '6px' }}>
      Valor Cada (coins):
      <div style={{ display: 'flex', gap: '6px' }}>
        <div
          className="campo-input"
          style={{ flex: 1, minWidth: 0, color: 'var(--color-text-muted)', cursor: 'default' }}
          title="Coins vendidas ÷ jogadores (arredondado pra baixo)"
        >
          {unitCoins.toLocaleString('pt-BR')} {playerCount > 0 ? `(÷ ${playerCount})` : ''}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={unitCoins <= 0}
          className="botao-secundario"
          title={copied ? 'Já copiado — clique pra copiar de novo' : 'Copiar valor'}
          style={{ marginTop: '4px', padding: '0 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
