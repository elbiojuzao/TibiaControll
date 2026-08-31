import type { PartyEventCategory } from '@/types';

/** Ícone/label de cada tipo de evento da party (2026-08-25) — compartilhado entre o form de
 * criação (Configurações, ver [[feedback_evento_em_configuracoes]]) e a exibição no
 * Calendário/Histórico (tooltip/modal do dia). Movido de modules/calendar-historico/ pra cá
 * em 2026-08-28 quando o cadastro de evento saiu do Calendário e foi pra Configurações —
 * ambas as telas precisam desses mapas, nenhuma das duas "dona" faz sentido sozinha. */
export const PARTY_EVENT_CATEGORIES: PartyEventCategory[] = ['double_xp', 'rapid_respawn', 'exaltation_forge', 'double_skill'];

export const PARTY_EVENT_CATEGORY_ICON: Record<PartyEventCategory, string> = {
  double_xp: '⭐',
  rapid_respawn: '🐇',
  exaltation_forge: '🔨',
  double_skill: '💪',
};

export const PARTY_EVENT_CATEGORY_LABEL: Record<PartyEventCategory, string> = {
  double_xp: 'Double XP',
  rapid_respawn: 'Rapid Respawn',
  exaltation_forge: 'Exaltation Forge',
  double_skill: 'Double Skill',
};
