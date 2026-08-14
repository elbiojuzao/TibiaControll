import manifest from '@/assets/potion-icons/manifest.json';

/**
 * Ícones reais das poções de skill (Mastermind/Berserk/Bullseye), baixados por
 * scripts/fetch-potion-icons.mjs pra src/assets/potion-icons/. Pipeline própria, separada
 * de item-icons.ts (loot de drop) — mesma técnica de resolução (tibia.fandom.com), fonte
 * de dado diferente (não vem de boss-items-data.ts).
 */
const iconModules = import.meta.glob<string>('/src/assets/potion-icons/*.gif', {
  eager: true,
  import: 'default',
});

const nameToUrl: Record<string, string> = {};
for (const [potionName, filename] of Object.entries(manifest as Record<string, string>)) {
  const url = iconModules[`/src/assets/potion-icons/${filename}`];
  if (url) nameToUrl[potionName] = url;
}

export function getPotionIconUrl(potionName: string): string | undefined {
  return nameToUrl[potionName];
}
