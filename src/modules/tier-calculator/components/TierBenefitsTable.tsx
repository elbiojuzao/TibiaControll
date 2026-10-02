import { MAX_TIER_BY_CLASSIFICATION, TIER_EFFECTS, TIER_LEVELS } from '@/services/tier';

const EFFECT_COLORS = [
  'var(--color-danger)',
  'var(--color-accent)',
  'var(--color-warning)',
  'var(--color-success)',
  'var(--color-text)',
];

function formatPercent(value: number) {
  return `${value.toFixed(2).replace('.', ',')}%`;
}

function classesForTier(tier: number): string {
  const classes = ([1, 2, 3, 4] as const).filter((c) => MAX_TIER_BY_CLASSIFICATION[c] >= tier);
  return classes.length === 4 ? 'Todas' : `Classe ${classes.join(', ')}`;
}

export function TierBenefitsTable() {
  return (
    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', alignItems: 'start' }}>
      <div className="card-compacto" style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 10px', color: 'var(--color-accent)' }}>Bônus por tier</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="tabela-simples">
            <thead>
              <tr className="texto-mudo" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="celula-esq">Tier</th>
                {TIER_EFFECTS.map((effect, i) => (
                  <th key={effect.key} className="celula-dir">
                    <span style={{ color: EFFECT_COLORS[i] }}>{effect.name}</span>
                    <div className="texto-fraco" style={{ fontSize: '11px', fontWeight: 'normal' }}>{effect.slot}</div>
                  </th>
                ))}
                <th className="celula-dir">Disponível em</th>
              </tr>
            </thead>
            <tbody>
              {TIER_LEVELS.map((tier) => (
                <tr key={tier} style={{ borderBottom: '1px solid var(--color-bg-elevated)' }}>
                  <td className="celula-esq" style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>Tier {tier}</td>
                  {TIER_EFFECTS.map((effect, i) => (
                    <td key={effect.key} className="celula-dir" style={{ color: EFFECT_COLORS[i] }}>
                      {formatPercent(effect.valuesByTier[tier - 1])}
                    </td>
                  ))}
                  <td className="celula-dir texto-mudo">{classesForTier(tier)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-compacto">
        <h3 style={{ fontSize: '14px', margin: '0 0 10px', color: 'var(--color-accent)' }}>O que cada efeito faz</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          {TIER_EFFECTS.map((effect, i) => (
            <div key={effect.key}>
              <strong style={{ color: EFFECT_COLORS[i] }}>{effect.name}</strong>{' '}
              <span className="texto-fraco">({effect.slot})</span>
              <div className="texto-mudo">{effect.description}</div>
            </div>
          ))}
        </div>
        <p className="texto-fraco" style={{ fontSize: '11px', margin: '12px 0 0' }}>
          Os percentuais são chances de ativação do efeito. A tabela é a mesma para qualquer classificação — a classe do
          item só define o tier máximo (Classe 1 até o tier 1, Classe 2 até o 2, Classe 3 até o 3, Classe 4 até o 10).
        </p>
      </div>
    </div>
  );
}
