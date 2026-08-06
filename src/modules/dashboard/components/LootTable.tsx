import { formatTibiaGold } from '@/services/split';
import type { LootDrop } from '@/types';
import { getBossBadgeStyle, guessItemIcon } from '../utils/loot-visuals';

interface LootTableProps {
  drops: LootDrop[];
}

export function LootTable({ drops }: LootTableProps) {
  if (drops.length === 0) {
    return <div className="empty-state">Nenhum drop registrado ainda.</div>;
  }

  return (
    <div className="loot-table-wrapper">
      <table className="loot-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>EK</th>
            <th>ED</th>
            <th>MS</th>
            <th>RP</th>
            <th>5º Player</th>
            <th>Service</th>
            <th>Valor cada</th>
            <th>Valor Total</th>
            <th>Fragador</th>
            <th>Item</th>
            <th>Boss</th>
            <th>Ícone</th>
            <th>Vendido</th>
            <th>Venda</th>
          </tr>
        </thead>
        <tbody>
          {drops.map((drop) => {
            const bossStyle = getBossBadgeStyle(drop.bossName);
            return (
              <tr key={drop.id}>
                <td>{drop.date}</td>
                <td className="col-vocation ek">{drop.party.ek ?? '—'}</td>
                <td className="col-vocation ed">{drop.party.ed ?? '—'}</td>
                <td className="col-vocation ms">{drop.party.ms ?? '—'}</td>
                <td className="col-vocation rp">{drop.party.rp ?? '—'}</td>
                <td className="col-vocation other">{drop.party.fifthPlayer ?? '—'}</td>
                <td className="col-vocation other">{drop.party.service ?? '—'}</td>
                <td className="col-gold positive">{formatTibiaGold(drop.unitValue)}</td>
                <td className="col-gold positive">{formatTibiaGold(drop.totalValue)}</td>
                <td>{drop.looter}</td>
                <td className="item-name">{drop.itemName}</td>
                <td>
                  <span className="boss-badge" title={drop.bossName} style={{ background: bossStyle.bg, color: bossStyle.color }}>
                    {drop.bossName}
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontSize: '1.1rem' }} title={drop.itemName}>
                  {guessItemIcon(drop.itemName)}
                </td>
                <td>
                  <span className={`sold-badge ${drop.sold ? 'yes' : 'no'}`}>
                    {drop.sold ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td>{drop.saleDate ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
