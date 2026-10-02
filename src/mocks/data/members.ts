import type { Member } from '@/types';
import { MOCK_ACCOUNT_ID } from './accounts';

export const mockMembers: Member[] = [
  {
    id: 'mem-001',
    accountId: MOCK_ACCOUNT_ID,
    characterName: 'Koe Psciko',
    previousNames: [],
    vocation: 'EK',
    isServiceiro: false,
    skillCategory: 'axefighting',
  },
  {
    id: 'mem-002',
    accountId: MOCK_ACCOUNT_ID,
    characterName: 'Thanatos Celestial',
    previousNames: [],
    vocation: 'ED',
    isServiceiro: false,
    skillCategory: 'magiclevel',
  },
  {
    id: 'mem-003',
    accountId: MOCK_ACCOUNT_ID,
    characterName: 'Marugo',
    previousNames: [],
    vocation: 'MS',
    isServiceiro: false,
    skillCategory: 'magiclevel',
  },
  {
    id: 'mem-004',
    accountId: MOCK_ACCOUNT_ID,
    characterName: 'Thor Zynz',
    previousNames: [],
    vocation: 'RP',
    isServiceiro: false,
    skillCategory: 'distancefighting',
  },
];
