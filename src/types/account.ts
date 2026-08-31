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
  /** Conta com permissão de administrador do app (2026-08-28) — não é por pessoa, é por
   * conta/party, mesmo modelo de login compartilhado. Hoje só controla quem vê/usa
   * "Adicionar Eventos" em Configurações (ver [[modulo-eventos-party]]). */
  isAdmin: boolean;
}
