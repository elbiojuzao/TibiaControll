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
  /** Mundo (servidor) do Tibia onde os personagens da party jogam (ex: 'Collabra') —
   * 2026-09-16, pedido do usuário: usado só pra consultar kill statistics do TibiaData por
   * criatura (ver [[integracao_tibiadata]] / componente CreatureKillCounter). Undefined/null
   * até o usuário configurar em Configurações. */
  world?: string;
}
