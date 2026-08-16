import type { Vocation } from './account';

/**
 * Categoria de skill consultada nos Highscores públicos do Tibia (via TibiaData) para
 * descobrir o valor de skill real do personagem. Necessário sobretudo pra EK, que pode
 * treinar Axe/Sword/Club — sem essa info explícita não dá pra saber qual highscore olhar.
 */
export type HighscoreSkillCategory =
  | 'magiclevel'
  | 'axefighting'
  | 'swordfighting'
  | 'clubfighting'
  | 'distancefighting';

export interface Member {
  id: string;
  accountId: string;
  characterName: string;
  vocation: Vocation;
  /** Indica se o membro e serviceiro (joga conta de terceiro) */
  isServiceiro: boolean;
  /** Percentual que fica com o serviceiro (0-100). Ex: 50 = split 50/50 */
  serviceiroSharePercent?: number;
  /** Dono da conta quando isServiceiro = true */
  ownerCharacterName?: string;
  /** Categoria de skill a consultar nos Highscores. Se ausente, é inferida pela vocação. */
  skillCategory?: HighscoreSkillCategory;
  /** Membro que efetivamente vende os itens (visita NPC/Market) — usado como "quem paga"
   * nos comandos de transferência do drop vendido, independente de quem looted (Fragador).
   * No máximo 1 por conta (garantido por índice único parcial no banco). */
  isDefaultSeller?: boolean;
}

export interface CreateMemberDto {
  characterName: string;
  vocation: Vocation;
  isServiceiro?: boolean;
  serviceiroSharePercent?: number;
  ownerCharacterName?: string;
  skillCategory?: HighscoreSkillCategory;
  isDefaultSeller?: boolean;
}
