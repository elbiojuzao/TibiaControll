import { useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { formatTibiaGold } from '@/services/split';
import { getBossBadgeStyle } from '../utils/loot-visuals';
import type { LootDrop } from '@/types';

interface ItemSummaryModalProps {
  itemName: string;
  /** Drops desse item nos últimos 365 dias — mesmo dataset já buscado pro Top Drop
   * (last365Drops em DashboardPage.tsx), sem exclusão de boss (a exclusão do Plunder no Top
   * Drop é regra de ranking POR JOGADOR — aqui é uma visão por item, não se aplica). */
  drops: LootDrop[];
  onClose: () => void;
}

/** Resumo de um item (2026-08-26, pedido do usuário: clicar num item na tabela "Drops no
 * mês" do Dashboard abre um resumo dele) — quantos já pegamos, quem mais fragou, de qual
 * boss mais veio e o valor total que o item já rendeu. Mesmo padrão visual/estrutural de
 * PlayerDropsModal (Top 3 em vez de Top 5 aqui). O ranking "De qual boss mais veio" só
 * aparece quando o item já caiu de mais de 1 boss diferente — itens como os de
 * Plunder/Phosphorus só caem daquele boss específico, e um "ranking" de 1 posição só seria
 * óbvio e redundante (ver showBossRanking abaixo). */
export function ItemSummaryModal({ itemName, drops, onClose }: ItemSummaryModalProps) {
  const sortedDrops = useMemo(
    () => [...drops].sort((a, b) => b.date.split('/').reverse().join('').localeCompare(a.date.split('/').reverse().join(''))),
    [drops],
  );

  const stats = useMemo(() => {
    const totalValue = drops.reduce((s, d) => s + d.totalValue, 0);
    const dropCount = drops.length;
    const soldCount = drops.filter((d) => d.sold).length;

    const looterStats = new Map<string, { count: number; totalValue: number }>();
    const bossStats = new Map<string, { count: number; totalValue: number }>();
    for (const d of drops) {
      if (d.looter) {
        const existing = looterStats.get(d.looter);
        if (existing) {
          existing.count += 1;
          existing.totalValue += d.totalValue;
        } else {
          looterStats.set(d.looter, { count: 1, totalValue: d.totalValue });
        }
      }
      const existingBoss = bossStats.get(d.bossName);
      if (existingBoss) {
        existingBoss.count += 1;
        existingBoss.totalValue += d.totalValue;
      } else {
        bossStats.set(d.bossName, { count: 1, totalValue: d.totalValue });
      }
    }
    const topLooters = [...looterStats.entries()]
      .map(([looter, s]) => ({ looter, ...s }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    const topBosses = [...bossStats.entries()]
      .map(([bossName, s]) => ({ bossName, ...s }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 3);

    return { totalValue, dropCount, soldCount, pendingCount: dropCount - soldCount, topLooters, topBosses };
  }, [drops]);

  // Ranking de boss só faz sentido quando o item realmente veio de mais de 1 boss
  // diferente (2026-08-26, pedido do usuário) — itens como os de Plunder/Phosphorus só
  // caem daquele boss específico, então mostrar um "ranking" de 1 posição só é óbvio e
  // inútil.
  const showBossRanking = stats.topBosses.length > 1;

  return (
    <Modal
      title={itemName || 'Item Raro'}
      onClose={onClose}
      maxWidth={780}
    >
      <p className="texto-fraco" style={{ fontSize: '11px', margin: '-8px 0 12px' }}>
        Últimos 365 dias
      </p>

      {drops.length === 0 && <p className="estado-vazio">Nenhum drop encontrado.</p>}

      {drops.length > 0 && (
        <>
          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '1rem' }}>
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: showBossRanking ? '1fr 1fr' : '1fr', gap: '0 16px' }}>
              <div>
                <span className="texto-mudo" style={{ fontSize: '12px', fontWeight: 'bold' }}>Top Jogadores (quem mais fragou)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {stats.topLooters.length === 0 && <p className="estado-vazio" style={{ margin: '4px 0', fontSize: '12px' }}>Sem fragador registrado.</p>}
                  {stats.topLooters.map((entry, idx) => (
                    <div key={entry.looter} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px', borderBottom: '1px solid var(--color-bg-elevated)' }}>
                      <span className="h22 w22" style={{
                        borderRadius: 'var(--radius-pill)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 'bold',
                        background: idx === 0 ? 'var(--color-warning)' : idx === 1 ? 'var(--color-text-muted)' : '#b45309',
                        color: 'var(--color-bg)',
                      }}>
                        {idx + 1}
                      </span>
                      <span className="texto-mudo" style={{ flex: 1, fontSize: '13px' }}>{entry.looter}</span>
                      <span style={{ textAlign: 'right' }}>
                        <span className="texto-sucesso" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>{formatTibiaGold(entry.totalValue)}</span>
                        <span className="texto-fraco" style={{ display: 'block', fontSize: '11px' }}>{entry.count}x</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {showBossRanking && (
                <div>
                  <span className="texto-mudo" style={{ fontSize: '12px', fontWeight: 'bold' }}>De qual boss mais veio</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    {stats.topBosses.map((entry, idx) => {
                      const bossStyle = getBossBadgeStyle(entry.bossName);
                      return (
                        <div key={entry.bossName} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px', borderBottom: '1px solid var(--color-bg-elevated)' }}>
                          <span className="h22 w22" style={{
                            borderRadius: 'var(--radius-pill)', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 'bold',
                            background: idx === 0 ? 'var(--color-warning)' : idx === 1 ? 'var(--color-text-muted)' : '#b45309',
                            color: 'var(--color-bg)',
                          }}>
                            {idx + 1}
                          </span>
                          <span className="boss-badge" style={{ background: bossStyle.bg, color: bossStyle.color, fontSize: '11px' }}>
                            {entry.bossName}
                          </span>
                          <span style={{ flex: 1 }} />
                          <span style={{ textAlign: 'right' }}>
                            <span className="texto-sucesso" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>{formatTibiaGold(entry.totalValue)}</span>
                            <span className="texto-fraco" style={{ display: 'block', fontSize: '11px' }}>{entry.count}x</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="stat-card">
                <label>Qtd. Drops</label>
                <div className="value">{stats.dropCount}</div>
              </div>
              <div className="stat-card">
                <label>Valor Total (vendas)</label>
                <div className="value texto-sucesso">{formatTibiaGold(stats.totalValue)}</div>
              </div>
              <div className="stat-card">
                <label>Vendidos / Pendentes</label>
                <div className="value" style={{ fontSize: '1rem' }}>{stats.soldCount} / {stats.pendingCount}</div>
              </div>
            </div>
          </div>

          <div className="loot-table-wrapper" style={{ maxHeight: '360px', overflowY: 'auto' }}>
            <table className="tabela-simples">
              <thead>
                <tr className="linha-cabecalho-tabela">
                  <th className="celula-esq">Data</th>
                  <th className="celula-esq">Fragador</th>
                  <th className="celula-esq">Boss</th>
                  <th className="celula-dir">Valor cada</th>
                  <th className="celula-dir">Valor Total</th>
                  <th className="celula-centro">Vendido</th>
                </tr>
              </thead>
              <tbody>
                {sortedDrops.map((drop, idx) => {
                  const bossStyle = getBossBadgeStyle(drop.bossName);
                  return (
                    <tr key={drop.id} className={idx % 2 === 0 ? 'linha-tabela-dado' : 'linha-tabela-dado-alt'}>
                      <td className="celula-esq">{drop.date}</td>
                      <td className="celula-esq">{drop.looter || '—'}</td>
                      <td className="celula-esq">
                        <span className="boss-badge" style={{ background: bossStyle.bg, color: bossStyle.color }}>
                          {drop.bossName}
                        </span>
                      </td>
                      <td className="celula-dir">{formatTibiaGold(drop.unitValue)}</td>
                      <td className="celula-dir texto-sucesso">{formatTibiaGold(drop.totalValue)}</td>
                      <td className="celula-centro">
                        <span className={`sold-badge ${drop.sold ? 'yes' : 'no'}`}>{drop.sold ? 'Sim' : 'Não'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}
