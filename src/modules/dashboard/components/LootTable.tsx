import { formatTibiaGold } from '@/services/split';
import type { LootDrop } from '@/types';
import { getBossBadgeStyle, guessItemIcon } from '../utils/loot-visuals';
import { getItemIconUrl } from '@/services/lootdrop/item-icons';
import { VOCATION_ICON } from '@/services/vocation/vocation-display';

function formatServices(drop: LootDrop): string {
  if (drop.party.services.length > 0) {
    return drop.party.services
      .map((s) => (s.vocation ? `${VOCATION_ICON[s.vocation]} ${s.serviceiroName}` : s.serviceiroName))
      .join(', ');
  }
  return drop.party.service ?? '—';
}

interface LootTableProps {
  drops: LootDrop[];
  onRowClick?: (drop: LootDrop) => void;
}

export function LootTable({ drops, onRowClick }: LootTableProps) {
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
            const iconUrl = getItemIconUrl(drop.itemName);
            return (
              <tr
                key={drop.id}
                onClick={() => onRowClick?.(drop)}
                title={onRowClick ? 'Clique para editar este drop' : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                <td>{drop.date}</td>
                <td className="col-vocation ek">{drop.party.ek ?? '—'}</td>
                <td className="col-vocation ed">{drop.party.ed ?? '—'}</td>
                <td className="col-vocation ms">{drop.party.ms ?? '—'}</td>
                <td className="col-vocation rp">{drop.party.rp ?? '—'}</td>
                <td className="col-vocation other">{drop.party.fifthPlayer ?? '—'}</td>
                <td className="col-vocation other">{formatServices(drop)}</td>
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
                  {iconUrl
                    ? <img src={iconUrl} alt={drop.itemName} width={24} height={24} style={{ imageRendering: 'pixelated', verticalAlign: 'middle' }} />
                    : guessItemIcon(drop.itemName)}
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
