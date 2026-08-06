/** Vocacao padrao de um personagem Tibia (EM = Elite Monk) */
export type Vocation = 'EK' | 'ED' | 'MS' | 'RP' | 'EM' | 'OTHER';

/** Tipo de workspace: party compartilhada ou solo */
export type AccountType = 'party' | 'solo';

export interface Account {
  id: string;
  username: string;
  partyName: string;
  type: AccountType;
  createdAt: string;
}

export interface CreateAccountDto {
  username: string;
  password: string;
  partyName: string;
  type: AccountType;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthSession {
  account: Account;
  token: string;
}
