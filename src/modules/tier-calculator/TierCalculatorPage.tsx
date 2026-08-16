import { useMemo, useState } from 'react';
import { formatTibiaGold } from '@/services/split';
import { calculateTierCost, getMaxTier } from '@/services/tier';
import type { ItemClassification, TierRouteResult } from '@/types';

const CLASSIFICATIONS: ItemClassification[] = [1, 2, 3, 4];

function buildTierOptions(maxTier: number) {
  return Array.from({ length: maxTier + 1 }, (_, tier) => tier);
}

function RouteTable({ result, title, accentColor }: { result: TierRouteResult; title: string; accentColor: string }) {
  return (
    <div style={{ background: 'var(--color-bg-elevated)', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '14px', margin: 0, color: accentColor }}>{title}</h3>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Chance de sucesso: <strong style={{ color: 'var(--color-text)' }}>{result.successChancePercent}%</strong>
        </span>
      </div>

      {result.steps.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--color-text-faint)', textAlign: 'center', margin: '20px 0' }}>
          Tier atual já é igual ou maior que o tier alvo.
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px' }}>Etapa</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Fusões</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Gold</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Dust</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Cores</th>
                </tr>
              </thead>
              <tbody>
                {result.steps.map((step) => (
                  <tr key={`${step.fromTier}-${step.toTier}`} style={{ borderBottom: '1px solid var(--color-bg-elevated)' }}>
                    <td style={{ padding: '6px', color: 'var(--color-text)' }}>
                      Tier {step.fromTier} → {step.toTier}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'right', color: 'var(--color-text-muted)' }}>{step.fusionsCount}x</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: accentColor, fontWeight: 'bold' }}>{formatTibiaGold(step.goldCost)}</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: 'var(--color-text-muted)' }}>{step.dustCost}</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: 'var(--color-text-muted)' }}>{step.exaltedCoreCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--color-border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ color: 'var(--color-text-muted)' }}>
              Dust total: <strong style={{ color: 'var(--color-text)' }}>{result.totalDust}</strong>
            </div>
            <div style={{ color: 'var(--color-text-muted)' }}>
              Exalted Cores: <strong style={{ color: 'var(--color-text)' }}>{result.totalExaltedCores}</strong>
            </div>
            <div style={{ color: 'var(--color-text-muted)' }}>
              Itens (tier {result.steps[0]?.fromTier}):{' '}
              <strong style={{ color: 'var(--color-text)' }}>{formatTibiaGold(result.totalItemsCost)}</strong>{' '}
              <span style={{ color: 'var(--color-text-faint)' }}>(x{result.totalItemsCount})</span>
            </div>
            <div style={{ color: 'var(--color-text-muted)', gridColumn: '1 / -1' }}>
              Custo total (gold + itens):{' '}
              <strong style={{ color: accentColor, fontSize: '14px' }}>{formatTibiaGold(result.grandTotal)}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function TierCalculatorPage() {
  const [classification, setClassification] = useState<ItemClassification>(4);
  const [currentTier, setCurrentTier] = useState<number>(0);
  const [targetTier, setTargetTier] = useState<number>(1);
  const [itemValue, setItemValue] = useState<number>(0);

  const maxTier = getMaxTier(classification);

  const handleClassificationChange = (value: ItemClassification) => {
    const newMax = getMaxTier(value);
    setClassification(value);
    setCurrentTier((prev) => Math.min(prev, newMax));
    setTargetTier((prev) => Math.min(Math.max(prev, 1), newMax));
  };

  const result = useMemo(
    () => calculateTierCost({ classification, currentTier, targetTier, itemValue }),
    [classification, currentTier, targetTier, itemValue],
  );

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: 'var(--color-text)' }}>
      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-accent)' }}>Calculadora Tier</h2>
        <p style={{ margin: '5px 0 0 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Estime o custo em gold para subir o tier de um item na Exaltation Forge, pela rota de sorte (Fusão, 65%) ou pela
          rota garantida (Convergência, 100% — só disponível para itens Classificação 4).
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
        <div style={{ background: 'var(--color-bg-elevated)', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--color-accent)' }}>Parâmetros</h3>

          <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Classificação do item
            <select
              value={classification}
              onChange={(e) => handleClassificationChange(Number(e.target.value) as ItemClassification)}
              style={{ width: '100%', marginTop: '4px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px' }}
            >
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  Classe {c} (tier máx. {getMaxTier(c)})
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Tier atual
            <select
              value={currentTier}
              onChange={(e) => {
                const value = Number(e.target.value);
                setCurrentTier(value);
                setTargetTier((prev) => Math.max(prev, value));
              }}
              style={{ width: '100%', marginTop: '4px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px' }}
            >
              {buildTierOptions(maxTier).map((tier) => (
                <option key={tier} value={tier}>
                  Tier {tier}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Tier alvo
            <select
              value={targetTier}
              onChange={(e) => setTargetTier(Number(e.target.value))}
              style={{ width: '100%', marginTop: '4px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px' }}
            >
              {buildTierOptions(maxTier)
                .filter((tier) => tier >= currentTier)
                .map((tier) => (
                  <option key={tier} value={tier}>
                    Tier {tier}
                  </option>
                ))}
            </select>
          </label>

          <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Valor de mercado do item (gold, 1 unidade)
            <input
              type="number"
              min={0}
              value={itemValue}
              onChange={(e) => setItemValue(Number(e.target.value) || 0)}
              placeholder="0"
              style={{ width: '100%', marginTop: '4px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px', boxSizing: 'border-box' }}
            />
          </label>

          <p style={{ fontSize: '11px', color: 'var(--color-text-faint)', margin: 0 }}>
            Toda fusão consome 2 itens idênticos do tier anterior — nenhum é de graça. Pra ter 1 item no tier alvo,
            cada nível abaixo dobra a quantidade de fusões necessárias (1, 2, 4, 8...); os itens tier atual só são
            comprados no nível mais baixo, os demais níveis só consomem o que foi produzido antes. O custo mostrado é
            de 1 tentativa por fusão, sem projetar perda de item em caso de falha na rota de sorte.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <RouteTable result={result.fusion} title="Rota de Sorte — Fusão (65%)" accentColor="var(--color-warning)" />
          {result.convergence ? (
            <RouteTable result={result.convergence} title="Rota Garantida — Convergência (100%)" accentColor="var(--color-success)" />
          ) : (
            <div style={{ background: 'var(--color-bg-elevated)', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-faint)', margin: 0 }}>
                Convergência não está disponível para itens Classificação {classification} — no jogo, essa rota só existe
                para itens Classificação 4.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
