import { useMemo, useState } from 'react';
import { formatTibiaGold } from '@/services/split';
import type { LootDrop } from '@/types';
import { getBossBadgeStyle, guessItemIcon } from '../utils/loot-visuals';
import { getItemIconUrl } from '@/services/lootdrop/item-icons';
import { VOCATION_ICON } from '@/services/vocation/vocation-display';
import { brToIso } from '@/services/common/br-date';

function formatServices(drop: LootDrop): string {
  if (drop.party.services.length > 0) {
    return drop.party.services
      .map((s) => (s.vocation ? `${VOCATION_ICON[s.vocation]} ${s.serviceiroName}` : s.serviceiroName))
      .join(', ');
  }
  return drop.party.service ?? '—';
}

type SortKey = 'date' | 'ek' | 'ed' | 'ms' | 'rp' | 'fifthPlayer' | 'service' | 'unitValue' | 'totalValue' | 'looter' | 'itemName' | 'bossName' | 'sold' | 'saleDate';
type SortDirection = 'asc' | 'desc';

/** Valor comparável de cada coluna — datas viram ISO (senão "01/12" ficaria antes de
 * "15/01" na ordenação de texto, por causa do dia vir primeiro no formato BR). */
function sortValue(drop: LootDrop, key: SortKey): string | number {
  switch (key) {
    case 'date': return brToIso(drop.date);
    case 'saleDate': return drop.saleDate ? brToIso(drop.saleDate) : '';
    case 'ek': return drop.party.ek ?? '';
    case 'ed': return drop.party.ed ?? '';
    case 'ms': return drop.party.ms ?? '';
    case 'rp': return drop.party.rp ?? '';
    case 'fifthPlayer': return drop.party.fifthPlayer ?? '';
    case 'service': return formatServices(drop);
    case 'unitValue': return drop.unitValue;
    case 'totalValue': return drop.totalValue;
    case 'looter': return drop.looter;
    case 'itemName': return drop.itemName;
    case 'bossName': return drop.bossName;
    case 'sold': return drop.sold ? 1 : 0;
  }
}

const COLUMNS: { key: SortKey | 'icon'; label: string; sortable: boolean }[] = [
  { key: 'date', label: 'Data', sortable: true },
  { key: 'ek', label: 'EK', sortable: true },
  { key: 'ed', label: 'ED', sortable: true },
  { key: 'ms', label: 'MS', sortable: true },
  { key: 'rp', label: 'RP', sortable: true },
  { key: 'fifthPlayer', label: '5º Player', sortable: true },
  { key: 'service', label: 'Service', sortable: true },
  { key: 'unitValue', label: 'Valor cada', sortable: true },
  { key: 'totalValue', label: 'Valor Total', sortable: true },
  { key: 'looter', label: 'Fragador', sortable: true },
  { key: 'itemName', label: 'Item', sortable: true },
  { key: 'bossName', label: 'Boss', sortable: true },
  { key: 'icon', label: 'Ícone', sortable: false },
  { key: 'sold', label: 'Vendido', sortable: true },
  { key: 'saleDate', label: 'Venda', sortable: true },
];

interface LootTableProps {
  drops: LootDrop[];
  onRowClick?: (drop: LootDrop) => void;
}

export function LootTable({ drops, onRowClick }: LootTableProps) {
  // Ordenação por coluna (2026-08-19, pedido do usuário: "clicar no cabeçalho... alterar a
  // ordenação asc descend") — clicar de novo na mesma coluna alterna a direção; clicar
  // numa coluna diferente reseta pra ascendente.
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedDrops = useMemo(() => {
    if (!sortKey) return drops;
    const factor = sortDir === 'asc' ? 1 : -1;
    return [...drops].sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
      return String(va).localeCompare(String(vb), 'pt-BR') * factor;
    });
  }, [drops, sortKey, sortDir]);

  if (drops.length === 0) {
    return <div className="empty-state">Nenhum drop registrado ainda.</div>;
  }

  return (
    <div className="loot-table-wrapper">
      <table className="loot-table">
        <thead>
          <tr>
            {COLUMNS.map((col) =>
              col.sortable ? (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col.key as SortKey)}
                  title="Clique para ordenar"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
              ) : (
                <th key={col.key}>{col.label}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {sortedDrops.map((drop) => {
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
                    ? <img src={iconUrl} alt={drop.itemName} className="h24 w24" style={{ imageRendering: 'pixelated', verticalAlign: 'middle' }} />
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
