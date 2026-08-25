import { useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { formatTibiaGold } from '@/services/split';
import { getItemIconUrl } from '@/services/lootdrop/item-icons';
import { getBossBadgeStyle, guessItemIcon } from '../utils/loot-visuals';
import type { LootDrop } from '@/types';

interface PlayerDropsModalProps {
  looter: string;
  /** Drops já filtrados pelas mesmas regras do ranking Top Drop (365 dias, sem Plunder) —
   * ver `topDropRanking` em DashboardPage.tsx. */
  drops: LootDrop[];
  onClose: () => void;
}

/** Resumo de drops por jogador (2026-08-25, pedido do usuário: clicar no nome no Top Drop
 * abre uma modal com todos os drops dele nos últimos 365 dias). Recebe os drops já
 * filtrados pelas MESMAS regras do ranking (sem Plunder) — os números daqui precisam bater
 * com o total mostrado no card Top Drop, senão confunde o usuário. */
export function PlayerDropsModal({ looter, drops, onClose }: PlayerDropsModalProps) {
  const sortedDrops = useMemo(
    () => [...drops].sort((a, b) => b.date.split('/').reverse().join('').localeCompare(a.date.split('/').reverse().join(''))),
    [drops],
  );

  const stats = useMemo(() => {
    const totalValue = drops.reduce((s, d) => s + d.totalValue, 0);
    const dropCount = drops.length;
    const avgValue = dropCount > 0 ? totalValue / dropCount : 0;

    const bossStats = new Map<string, { count: number; totalValue: number }>();
    for (const d of drops) {
      const existing = bossStats.get(d.bossName);
      if (existing) {
        existing.count += 1;
        existing.totalValue += d.totalValue;
      } else {
        bossStats.set(d.bossName, { count: 1, totalValue: d.totalValue });
      }
    }
    const topBosses = [...bossStats.entries()]
      .map(([bossName, s]) => ({ bossName, ...s }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    return { totalValue, dropCount, avgValue, topBosses };
  }, [drops]);

  return (
    <Modal title={`Drops de ${looter}`} onClose={onClose} maxWidth={780}>
      <p className="texto-fraco" style={{ fontSize: '11px', margin: '-8px 0 12px' }}>
        Últimos 365 dias — mesmos drops que contam para o Top Drop (Plunder não entra)
      </p>

      {drops.length === 0 && <p className="estado-vazio">Nenhum drop encontrado.</p>}

      {drops.length > 0 && (
        <>
          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '1rem' }}>
            <div>
              <span className="texto-mudo" style={{ fontSize: '12px', fontWeight: 'bold' }}>Top 5 Bosses</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {stats.topBosses.map((entry, idx) => {
                  const bossStyle = getBossBadgeStyle(entry.bossName);
                  return (
                    <div key={entry.bossName} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px', borderBottom: '1px solid var(--color-bg-elevated)' }}>
                      <span className="h22 w22" style={{
                        borderRadius: 'var(--radius-pill)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 'bold',
                        background: idx === 0 ? 'var(--color-warning)' : idx === 1 ? 'var(--color-text-muted)' : idx === 2 ? '#b45309' : 'var(--color-border)',
                        color: idx <= 2 ? 'var(--color-bg)' : 'var(--color-text-muted)',
                      }}>
                        {idx + 1}
                      </span>
                      <span className="boss-badge" style={{ background: bossStyle.bg, color: bossStyle.color }}>
                        {entry.bossName}
                      </span>
                      <span style={{ flex: 1 }} />
                      <span style={{ textAlign: 'right' }}>
                        <span className="texto-sucesso" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>
                          {formatTibiaGold(entry.totalValue)}
                        </span>
                        <span className="texto-fraco" style={{ display: 'block', fontSize: '11px' }}>
                          {entry.count} {entry.count === 1 ? 'drop' : 'drops'}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="stat-card">
                <label>Qtd. Drops</label>
                <div className="value">{stats.dropCount}</div>
              </div>
              <div className="stat-card">
                <label>Valor Total</label>
                <div className="value texto-sucesso">{formatTibiaGold(stats.totalValue)}</div>
              </div>
              <div className="stat-card">
                <label>Média por Drop</label>
                <div className="value">{formatTibiaGold(Math.round(stats.avgValue))}</div>
              </div>
            </div>
          </div>

          <div className="loot-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="tabela-simples">
              <thead>
                <tr className="linha-cabecalho-tabela">
                  <th className="celula-esq">Data</th>
                  <th className="celula-esq">Boss</th>
                  <th className="celula-esq">Item</th>
                  <th className="celula-dir">Valor cada</th>
                  <th className="celula-dir">Valor Total</th>
                  <th className="celula-centro">Vendido</th>
                </tr>
              </thead>
              <tbody>
                {sortedDrops.map((drop, idx) => {
                  const bossStyle = getBossBadgeStyle(drop.bossName);
                  const iconUrl = getItemIconUrl(drop.itemName);
                  return (
                    <tr key={drop.id} className={idx % 2 === 0 ? 'linha-tabela-dado' : 'linha-tabela-dado-alt'}>
                      <td className="celula-esq">{drop.date}</td>
                      <td className="celula-esq">
                        <span className="boss-badge" style={{ background: bossStyle.bg, color: bossStyle.color }}>
                          {drop.bossName}
                        </span>
                      </td>
                      <td className="celula-esq" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {iconUrl
                          ? <img src={iconUrl} alt="" className="h20 w20" style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                          : <span>{guessItemIcon(drop.itemName)}</span>}
                        {drop.itemName}
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
