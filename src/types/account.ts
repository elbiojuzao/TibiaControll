/** Vocacao padrao de um personagem Tibia (EM = Elite Monk) */
export type Vocation = 'EK' | 'ED' | 'MS' | 'RP' | 'EM' | 'OTHER';

/** Tipo de workspace: party compartilhada ou solo */
export type AccountType = 'party' | 'solo';

/** Workspace da party — sem username/senha aqui, isso agora é responsabilidade do Supabase
 * Auth (ver useAuth/RequireAuth), decoupled desse tipo de propósito. */
export interface Account {
  id: string;
  partyName: string;
  type: AccountType;
  createdAt: string;
}
