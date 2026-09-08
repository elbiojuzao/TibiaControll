/** Fallback visual pra Dedication/Conviction Perks (2026-09-04) — não é parte do código
 * copiado do tibia-wheel original. Os ícones REAIS de fatia (spritesheet
 * icons-skillwheel-mediumperks/smallperks) não existem como arquivo baixável em lugar
 * nenhum (são desenhados direto no canvas do tibiapal.com, sem asset extraível) — usar o
 * sprite de 2022 do gitlab quebraria visualmente, já que os índices do catálogo mudaram
 * inteiro (Vessel Resonance entrou, resistências saíram, Monk é novo). Decisão do usuário:
 * emoji genérico por categoria até resolvermos a extração de ícone real. Revelation Perks
 * (medalhões) continuam com o sprite real — esse foi baixado com sucesso (arquivo público
 * em tibiapal.com/images/wod-planner/). */

const DEDICATION_EMOJI = ['❤️', '🔵', '💠', '🎒', '🛡️'];

export function dedicationEmoji(index: number): string {
  return DEDICATION_EMOJI[index] ?? '❔';
}

export function convictionEmoji(name: string): string {
  if (name.startsWith('Vessel Resonance')) return '🔮';
  if (name === 'Mana Leech') return '🔷';
  if (name === 'Life Leech') return '🩸';
  if (name.includes('Skill Boost')) return '⚔️';
  if (name.startsWith('Augmented')) return '✨';
  return '⭐';
}
