import type { LootDrop } from '@/types';
import { MOCK_ACCOUNT_ID } from './accounts';

/**
 * Dados mock baseados na planilha de drops da PT.
 * Colunas: data | EK | ED | MS | RP | 5 Player | Service | Valor cada | Valor Total | Fragador | ITEM | Boss | Sold | Venda
 */
export const mockLootDrops: LootDrop[] = [
  {
    id: 'drop-001',
    accountId: MOCK_ACCOUNT_ID,
    date: '05/06/2023',
    party: {
      ek: 'Koe Psciko',
      ed: 'Thanatos Celestial',
      ms: 'Marugo',
      rp: 'Thor Zynz',
    },
    unitValue: 989_759_000,
    totalValue: 935_000_000,
    looter: 'Koe Psciko',
    itemName: 'Strange Inedible Fruit',
    bossName: 'The Rootkraken',
    sold: true,
    saleDate: '12/06/2023',
  },
  {
    id: 'drop-002',
    accountId: MOCK_ACCOUNT_ID,
    date: '18/07/2023',
    party: {
      ek: 'Koe Psciko',
      ed: 'Thanatos Celestial',
      ms: 'Marugo',
      rp: 'Thor Zynz',
    },
    unitValue: 450_000_000,
    totalValue: 427_500_000,
    looter: 'Thor Zynz',
    itemName: 'Arboreal Crown',
    bossName: 'Plunder Patriarch',
    sold: true,
    saleDate: '25/07/2023',
  },
  {
    id: 'drop-003',
    accountId: MOCK_ACCOUNT_ID,
    date: '02/09/2023',
    party: {
      ek: 'Koe Psciko',
      ed: 'Thanatos Celestial',
      ms: 'Marugo',
      rp: 'Thor Zynz',
      fifthPlayer: 'Dark Mage',
    },
    unitValue: 1_200_000_000,
    totalValue: 1_140_000_000,
    looter: 'Marugo',
    itemName: 'Soulshroud',
    bossName: 'Goshnar\'s Megalomania',
    sold: false,
  },
  {
    id: 'drop-004',
    accountId: MOCK_ACCOUNT_ID,
    date: '15/11/2023',
    party: {
      ek: 'Koe Psciko',
      ed: 'Thanatos Celestial',
      ms: 'Marugo',
      rp: 'Thor Zynz',
      service: 'Service Char',
    },
    unitValue: 780_000_000,
    totalValue: 741_000_000,
    looter: 'Thanatos Celestial',
    itemName: 'Grand Sanguine Blade',
    bossName: 'Bakragore',
    sold: true,
    saleDate: '20/11/2023',
  },
  {
    id: 'drop-005',
    accountId: MOCK_ACCOUNT_ID,
    date: '08/01/2024',
    party: {
      ek: 'Koe Psciko',
      ed: 'Thanatos Celestial',
      ms: 'Marugo',
      rp: 'Thor Zynz',
    },
    unitValue: 320_000_000,
    totalValue: 304_000_000,
    looter: 'Koe Psciko',
    itemName: 'Magma Amulet',
    bossName: 'Magma Bubble',
    sold: false,
  },
];
