const BOSS_PALETTE = [
  { bg: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }, // roxo
  { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }, // azul
  { bg: 'rgba(6, 182, 212, 0.2)', color: '#67e8f9' }, // ciano
  { bg: 'var(--color-danger-soft)', color: 'var(--color-danger)' }, // vermelho
  { bg: 'var(--color-warning-soft)', color: '#fde68a' }, // amber
  { bg: 'var(--color-success-soft)', color: '#6ee7b7' }, // verde
  { bg: 'rgba(236, 72, 153, 0.2)', color: '#f9a8d4' }, // rosa
  { bg: 'rgba(100, 116, 139, 0.2)', color: 'var(--color-text-muted)' }, // slate
];

/** Cor determinística por nome do boss, para o badge da coluna Boss ficar consistente entre sessões */
export function getBossBadgeStyle(bossName: string) {
  let hash = 0;
  for (let i = 0; i < bossName.length; i++) {
    hash = (hash * 31 + bossName.charCodeAt(i)) >>> 0;
  }
  return BOSS_PALETTE[hash % BOSS_PALETTE.length];
}

const ITEM_ICON_RULES: [RegExp, string][] = [
  [/boot|shoe|galosh|sandal|footwrap/i, '👢'],
  [/ring/i, '💍'],
  [/crown|circlet|diadem|coronet/i, '👑'],
  [/hat|hood|helm|mask|cap|coif|casque|visor/i, '🎩'],
  [/blade|sword|axe|hatchet|mace|club|katar|claw|dagger|spear|halberd/i, '⚔️'],
  [/rod|wand|sceptre/i, '🪄'],
  [/bow|crossbow|arbalest/i, '🏹'],
  [/armor|plate|robe|mail|cuirass|tunic|vest/i, '🛡️'],
  [/legs|trousers|kilt|breeches|pantaloons|culet|faulds/i, '👖'],
  [/amulet|necklace|sigil/i, '📿'],
  [/fruit|food/i, '🍎'],
  [/shield/i, '🔰'],
];

/** Emoji de placeholder até termos ícones reais do item (via API/CDN futura) */
export function guessItemIcon(itemName: string): string {
  const match = ITEM_ICON_RULES.find(([regex]) => regex.test(itemName));
  return match ? match[1] : '💎';
}
