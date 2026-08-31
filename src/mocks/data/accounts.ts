import type { Account } from '@/types';

export const MOCK_ACCOUNT_ID = 'acc-demo-001';

export const mockAccount: Account = {
  id: MOCK_ACCOUNT_ID,
  partyName: 'Thanatos PT',
  type: 'party',
  createdAt: '2023-01-15T00:00:00.000Z',
  // true só no mock (dev local) pra dar pra testar a seção "Adicionar Eventos" (Configurações,
  // ver [[modulo-eventos-party]]) sem precisar mexer no banco real — produção nasce false
  // por padrão (migration 20260828000000), precisa de UPDATE manual pra virar admin.
  isAdmin: true,
};
