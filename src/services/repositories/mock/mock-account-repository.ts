import type { Account, AuthSession, CreateAccountDto, LoginDto } from '@/types';
import type { IAccountRepository } from '../interfaces';
import { mockAccount } from '@/mocks/data/accounts';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export class MockAccountRepository implements IAccountRepository {
  private currentSession: AuthSession | null = null;

  async login(credentials: LoginDto): Promise<AuthSession> {
    await delay();
    if (credentials.username === 'demo@pt.com' && credentials.password === 'demo123') {
      this.currentSession = { account: mockAccount, token: 'mock-jwt-token' };
      localStorage.setItem('auth_token', this.currentSession.token);
      localStorage.setItem('account_id', mockAccount.id);
      return this.currentSession;
    }
    throw new Error('Credenciais invalidas');
  }

  async getCurrentAccount(): Promise<Account | null> {
    await delay(100);
    const token = localStorage.getItem('auth_token');
    if (token) return mockAccount;
    return this.currentSession?.account ?? null;
  }

  async logout(): Promise<void> {
    await delay(50);
    this.currentSession = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('account_id');
  }

  async createAccount(dto: CreateAccountDto): Promise<Account> {
    await delay();
    return {
      id: crypto.randomUUID(),
      username: dto.username,
      partyName: dto.partyName,
      type: dto.type,
      createdAt: new Date().toISOString(),
    };
  }
}
