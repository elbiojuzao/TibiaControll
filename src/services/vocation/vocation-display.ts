import type { Vocation } from '@/types';

/**
 * Ícone por vocação, definido pelo usuário: espada (EK), varinha de morte (MS),
 * varinha de gelo (ED), arco e flecha (RP), ying yang (EM/Monk).
 */
export const VOCATION_ICON: Record<Vocation, string> = {
  EK: '⚔️',
  MS: '💀',
  ED: '❄️',
  RP: '🏹',
  EM: '☯️',
  OTHER: '❔',
};

export const VOCATION_LABEL: Record<Vocation, string> = {
  EK: 'Knight',
  MS: 'Sorcerer',
  ED: 'Druid',
  RP: 'Paladin',
  EM: 'Monk',
  OTHER: 'Outra',
};

/** Vocações que fazem sentido oferecer como "faço serviço nessa vocação" (exclui OTHER) */
export const SERVICEIRO_VOCATIONS: Vocation[] = ['EK', 'MS', 'ED', 'RP', 'EM'];
