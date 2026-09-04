import type { GemSize } from '@/types';

/** Ateliê de Gemas (Gem Atelier) — mecânica real extraída da TibiaWiki
 * (tibia.fandom.com/wiki/Wheel_of_Destiny, seção "Gem Atelier", 2026-09-02). Sistema
 * separado da roda em si (adicionado na Winter Update 2023) — gems dropam de bosses,
 * revelar vincula ao personagem, e socketam em "vessels" do domínio de mesma cor. */

export const GEM_MOD_SLOTS: Record<GemSize, number> = {
  lesser: 1,
  regular: 2,
  greater: 3,
};

export const GEM_SIZE_LABEL: Record<GemSize, string> = {
  lesser: 'Lesser Gem',
  regular: 'Regular Gem',
  greater: 'Greater Gem',
};

/** Custo em gold pra girar a afinidade de domínio do gem pro próximo domínio (sentido
 * horário) e pra revelar os mods de um gem ainda não revelado. */
export const GEM_ATELIER_COSTS: Record<GemSize, { rotateAffinity: number; revealMods: number }> = {
  lesser: { rotateAffinity: 125_000, revealMods: 125_000 },
  regular: { rotateAffinity: 250_000, revealMods: 1_000_000 },
  greater: { rotateAffinity: 500_000, revealMods: 6_000_000 },
};

/** Bônus de dano/cura por combinação tamanho-do-gem × nº de Vessel Resonances habilitadas
 * batendo com o nº de mod slots do gem (dado real da TibiaWiki). */
export const GEM_VESSEL_DAMAGE_HEALING_BONUS: Record<GemSize, number> = {
  lesser: 1,
  regular: 1,
  greater: 2,
};

/** Fragment Workshop — custo pra subir 1 mod de Grau I até Grau IV (+50% de bônus no Grau
 * IV em relação ao Grau I). Grades intermediários de um mod slot posterior ficam "presos"
 * no grau do slot anterior (ex: Supreme Mod em Grau IV não se beneficia se os Basic Mods
 * ainda estiverem em Grau I). */
export const FRAGMENT_WORKSHOP_UPGRADE_COST = [
  { grade: 'II', fragments: 5, goldBasicMod: 2_000_000, goldSupremeMod: 5_000_000 },
  { grade: 'III', fragments: 15, goldBasicMod: 5_000_000, goldSupremeMod: 12_500_000 },
  { grade: 'IV', fragments: 30, goldBasicMod: 30_000_000, goldSupremeMod: 75_000_000 },
] as const;

/** Progressão real de valor por grau (ex: mods percentuais tipo resistência elemental) —
 * extraída do JSON de dados públicos do wheel-planner do tibiapal
 * (data/wheel-planner/SkillwheelStringsJsonLibrary.json, BasicModConfig) — usada aqui como
 * a escala padrão de "quanto cada grau melhora" um mod percentual genérico, já que o
 * catálogo completo (centenas de mods específicos por efeito) está fora do escopo desta
 * primeira leva. */
export const MOD_GRADE_SCALE = ['+1%', '+1.1%', '+1.2%', '+1.5%'] as const;

export const GEM_ATELIER_LIMITS = {
  /** Máximo de gems revelados/vinculados por personagem. */
  maxRevealedGems: 225,
  /** Máximo de Vessel Resonances habilitáveis por domínio (bate com o maior gem, Greater = 3 slots). */
  maxVesselsPerDomain: 3,
};
