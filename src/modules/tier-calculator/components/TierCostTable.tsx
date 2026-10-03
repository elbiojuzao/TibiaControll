import { buildTierCostRows, formatCostKk } from '@/services/tier';
import type { TierCostCell } from '@/services/tier';
import {
  CONVERGENCE_TRANSFER_DUST_COST,
  TRANSFER_DUST_COST,
  TRANSFER_EXALTED_CORE_UNCONFIRMED_FROM_TIER,
} from '@/services/tier/tier-cost-data';

const ROWS = buildTierCostRows();

/** Uma célula de custo: gold em kk (valor exato no tooltip) e, quando o método exige, os
 * Exalted Cores logo abaixo. `unconfirmedCores` marca com * os cores ainda não confirmados. */
function CostCell({ cell, color, unconfirmedCores }: { cell: TierCostCell | null; color: string; unconfirmedCores?: boolean }) {
  if (!cell) return <td className="celula-dir texto-fraco">—</td>;
  return (
    <td className="celula-dir">
      <strong style={{ color }} title={`${cell.gold.toLocaleString('pt-BR')} gold`}>{formatCostKk(cell.gold)}</strong>
      {cell.cores > 0 && (
        <div className="texto-fraco" style={{ fontSize: '11px' }}>
          {cell.cores} {cell.cores === 1 ? 'core' : 'cores'}{unconfirmedCores ? '*' : ''}
        </div>
      )}
    </td>
  );
}

/** Tabela de custo por tier (2026-10-02, pedido do usuário) — Fusão, Convergência, Transferência
 * e Transferência por Convergência lado a lado, Classificação 4. Mostra o custo de UMA operação
 * pra chegar naquele tier (a calculadora acima é que soma a cadeia inteira). Dados em
 * services/tier/tier-cost-data.ts. */
export function TierCostTable() {
  return (
    <div className="card-compacto" style={{ minWidth: 0 }}>
      <h3 style={{ fontSize: '14px', margin: '0 0 4px', color: 'var(--color-accent)' }}>Custo por tier — Classificação 4</h3>
      <p className="texto-fraco" style={{ fontSize: '12px', margin: '0 0 10px' }}>
        Gold de uma operação para <strong>chegar</strong> ao tier da linha (passe o mouse no valor para ver o número completo).
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table className="tabela-simples">
          <thead>
            <tr className="texto-mudo" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th className="celula-esq">Tier</th>
              <th className="celula-dir"><span style={{ color: 'var(--color-warning)' }}>Fusão</span><div className="texto-fraco" style={{ fontSize: '11px', fontWeight: 'normal' }}>sorte 65%</div></th>
              <th className="celula-dir"><span style={{ color: 'var(--color-success)' }}>Convergência</span><div className="texto-fraco" style={{ fontSize: '11px', fontWeight: 'normal' }}>garantida 100%</div></th>
              <th className="celula-dir"><span style={{ color: 'var(--color-accent)' }}>Transferência</span><div className="texto-fraco" style={{ fontSize: '11px', fontWeight: 'normal' }}>perde 1 tier</div></th>
              <th className="celula-dir"><span style={{ color: 'var(--color-danger)' }}>Transf. por Convergência</span><div className="texto-fraco" style={{ fontSize: '11px', fontWeight: 'normal' }}>sem perder tier</div></th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.tier} style={{ borderBottom: '1px solid var(--color-bg-elevated)' }}>
                <td className="celula-esq" style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>Tier {row.tier}</td>
                <CostCell cell={row.fusion} color="var(--color-warning)" />
                <CostCell cell={row.convergence} color="var(--color-success)" />
                <CostCell cell={row.transfer} color="var(--color-accent)" unconfirmedCores={row.tier >= TRANSFER_EXALTED_CORE_UNCONFIRMED_FROM_TIER} />
                <CostCell cell={row.convergenceTransfer} color="var(--color-danger)" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="texto-fraco" style={{ fontSize: '11px', margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span><strong>Fusão:</strong> 2 itens do mesmo tier, 100 Dust e 2 Exalted Cores por tentativa; 65% de sucesso (falha pode custar 1 tier de um dos itens).</span>
        <span><strong>Convergência:</strong> 2 itens diferentes do mesmo slot e tier, 130 Dust, sem cores, sucesso garantido. Só Classe 4.</span>
        <span>
          <strong>Transferência:</strong> {TRANSFER_DUST_COST} Dust + cores. Um item de tier {'N+1'} (mínimo tier 2) é destruído e o receptor (tier 0) termina no tier N — a linha mostra o tier final, por isso não há tier 10.
        </span>
        <span>
          <strong>Transferência por Convergência:</strong> {CONVERGENCE_TRANSFER_DUST_COST} Dust + cores. O receptor termina no mesmo tier do doador, sem perder nenhum. Só Classe 4.
        </span>
        <span>* Cores da Transferência nos tiers 6 a 9 seguem a mesma série da Transferência por Convergência — não confirmados em fonte separada.</span>
      </div>
    </div>
  );
}
