import type { Member } from '@/types';
import { MOCK_ACCOUNT_ID } from './accounts';

export const mockMembers: Member[] = [
  {
    id: 'mem-001',
    accountId: MOCK_ACCOUNT_ID,
    characterName: 'Koe Psciko',
    vocation: 'EK',
    isServiceiro: false,
    skillCategory: 'axefighting',
  },
  {
    id: 'mem-002',
    accountId: MOCK_ACCOUNT_ID,
    characterName: 'Thanatos Celestial',
    vocation: 'ED',
    isServiceiro: false,
    skillCategory: 'magiclevel',
  },
  {
    id: 'mem-003',
    accountId: MOCK_ACCOUNT_ID,
    characterName: 'Marugo',
    vocation: 'MS',
    isServiceiro: false,
    skillCategory: 'magiclevel',
  },
  {
    id: 'mem-004',
    accountId: MOCK_ACCOUNT_ID,
    characterName: 'Thor Zynz',
    vocation: 'RP',
    isServiceiro: false,
    skillCategory: 'distancefighting',
  },
];
