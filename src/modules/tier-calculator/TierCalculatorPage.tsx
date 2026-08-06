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
    <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '14px', margin: 0, color: accentColor }}>{title}</h3>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          Chance de sucesso: <strong style={{ color: '#f8fafc' }}>{result.successChancePercent}%</strong>
        </span>
      </div>

      {result.steps.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '20px 0' }}>
          Tier atual já é igual ou maior que o tier alvo.
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ textAlign: 'left', padding: '6px' }}>Etapa</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Gold</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Dust</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Cores</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Itens (2x)</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Total etapa</th>
                </tr>
              </thead>
              <tbody>
                {result.steps.map((step) => (
                  <tr key={`${step.fromTier}-${step.toTier}`} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '6px', color: '#f8fafc' }}>
                      Tier {step.fromTier} → {step.toTier}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'right', color: '#f8fafc' }}>{formatTibiaGold(step.goldCost)}</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: '#94a3b8' }}>{step.dustCost}</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: '#94a3b8' }}>{step.exaltedCoreCost}</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: '#94a3b8' }}>{formatTibiaGold(step.itemsCost)}</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: accentColor, fontWeight: 'bold' }}>
                      {formatTibiaGold(step.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid #334155',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ color: '#94a3b8' }}>
              Dust total: <strong style={{ color: '#f8fafc' }}>{result.totalDust}</strong>
            </div>
            <div style={{ color: '#94a3b8' }}>
              Exalted Cores: <strong style={{ color: '#f8fafc' }}>{result.totalExaltedCores}</strong>
            </div>
            <div style={{ color: '#94a3b8', gridColumn: '1 / -1' }}>
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
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc' }}>
      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#10b981' }}>Calculadora Tier</h2>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
          Estime o custo em gold para subir o tier de um item na Exaltation Forge, pela rota de sorte (Fusão, 65%) ou pela
          rota garantida (Convergência, 100% — só disponível para itens Classificação 4).
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
        <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '14px', margin: 0, color: '#38bdf8' }}>Parâmetros</h3>

          <label style={{ fontSize: '12px', color: '#94a3b8' }}>
            Classificação do item
            <select
              value={classification}
              onChange={(e) => handleClassificationChange(Number(e.target.value) as ItemClassification)}
              style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '6px' }}
            >
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  Classe {c} (tier máx. {getMaxTier(c)})
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: '12px', color: '#94a3b8' }}>
            Tier atual
            <select
              value={currentTier}
              onChange={(e) => {
                const value = Number(e.target.value);
                setCurrentTier(value);
                setTargetTier((prev) => Math.max(prev, value));
              }}
              style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '6px' }}
            >
              {buildTierOptions(maxTier).map((tier) => (
                <option key={tier} value={tier}>
                  Tier {tier}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: '12px', color: '#94a3b8' }}>
            Tier alvo
            <select
              value={targetTier}
              onChange={(e) => setTargetTier(Number(e.target.value))}
              style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '6px' }}
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

          <label style={{ fontSize: '12px', color: '#94a3b8' }}>
            Valor de mercado do item (gold, 1 unidade)
            <input
              type="number"
              min={0}
              value={itemValue}
              onChange={(e) => setItemValue(Number(e.target.value) || 0)}
              placeholder="0"
              style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '6px', boxSizing: 'border-box' }}
            />
          </label>

          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            Cada etapa de Fusão/Convergência consome 2 itens do tier atual. O custo mostrado é de 1 tentativa por etapa
            (não projeta perda de item em caso de falha na rota de sorte).
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <RouteTable result={result.fusion} title="Rota de Sorte — Fusão (65%)" accentColor="#f59e0b" />
          {result.convergence ? (
            <RouteTable result={result.convergence} title="Rota Garantida — Convergência (100%)" accentColor="#10b981" />
          ) : (
            <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
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
