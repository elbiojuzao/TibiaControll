import type { Serviceiro } from '@/types';
import { MOCK_ACCOUNT_ID } from './accounts';

export const mockServiceiros: Serviceiro[] = [
  {
    id: 'serv-001',
    accountId: MOCK_ACCOUNT_ID,
    name: 'Dedinho',
    characterName: 'Dedinho',
    phoneNumber: '5511987654321',
    vocations: ['EK'],
  },
  {
    id: 'serv-002',
    accountId: MOCK_ACCOUNT_ID,
    name: 'Ismael',
    characterName: 'Ismael',
    phoneNumber: '5511976543210',
    vocations: ['ED', 'MS'],
  },
  {
    id: 'serv-003',
    accountId: MOCK_ACCOUNT_ID,
    name: 'Bon Ka',
    characterName: 'Bon Ka',
    phoneNumber: '5511965432109',
    vocations: ['RP', 'EM'],
  },
];
