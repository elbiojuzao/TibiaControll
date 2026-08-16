import type { Account } from '@/types';
import type { IAccountRepository } from '../interfaces';
import { mockAccount } from '@/mocks/data/accounts';

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

let accountStore: Account = { ...mockAccount };

/** Ainda mock — só 1 party existe (não é cadastro multi-tenant de verdade). Login real de
 * quem pode entrar é Supabase Auth (useAuth), separado disso. */
export class MockAccountRepository implements IAccountRepository {
  async getCurrentAccount(): Promise<Account | null> {
    await delay();
    return accountStore;
  }

  async updatePartyName(_accountId: string, partyName: string): Promise<Account> {
    await delay();
    accountStore = { ...accountStore, partyName };
    return accountStore;
  }
}
