import type { PartyEventCategory } from '@/types';

/** Ícone/label de cada tipo de evento da party (2026-08-25) — compartilhado entre
 * PartyEventFormModal (seleção) e CalendarioPage (exibição no tooltip/modal do dia). */
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
