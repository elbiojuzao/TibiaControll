/** Categorias de bônus que um evento oficial da CipSoft pode conceder — ver
 * migration 20260817010000_create_tibia_events_table.sql. */
export type TibiaEventCategory = 'rapid_respawn' | 'xp_boost' | 'potion_boost';

/** Evento oficial anual fixo (regra do jogo, não é dado de conta) — data
 * recorrente por mês/dia, sem ano (se repete todo ano na mesma janela). */
export interface TibiaEvent {
  id: string;
  name: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  categories: TibiaEventCategory[];
  description: string;
}
