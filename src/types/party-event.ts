/** Tipo de bônus/mecânica do evento cadastrado (2026-08-25, pedido do usuário: "a modal de
 * evento tem que ter o tipo do evento (double xp rapid resp ou exaltation forge)") — lista
 * fixa fechada, confirmada com o usuário via AskUserQuestion. Um evento pode ter mais de 1
 * tipo ao mesmo tempo (ex: Double XP + Rapid Respawn juntos). */
export type PartyEventCategory = 'double_xp' | 'rapid_respawn' | 'exaltation_forge' | 'double_skill';

/** Evento cadastrado manualmente pelo usuário pra própria conta/PT (2026-08-25, pedido do
 * usuário: "o botao de adicionar novo evento que abre a modal e o usuario vai digitar
 * sobre o evento e cadastrar") — diferente de TibiaEvent (evento OFICIAL do jogo, tabela
 * separada `tibia_events`, sem account_id, recorrente por mês/dia todo ano): este é um
 * evento PRÓPRIO da party, com data concreta (ano incluso), compartilhado entre quem loga
 * na mesma conta (mesmo padrão de visibilidade de drops/splits/membros). */
export interface PartyEvent {
  id: string;
  accountId: string;
  title: string;
  description: string;
  /** DD/MM/YYYY */
  startDate: string;
  /** DD/MM/YYYY — igual a startDate quando o evento é de 1 dia só */
  endDate: string;
  categories: PartyEventCategory[];
  createdAt: string;
}

export interface CreatePartyEventDto {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  categories: PartyEventCategory[];
}
