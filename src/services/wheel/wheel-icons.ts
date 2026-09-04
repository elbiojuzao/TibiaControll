/**
 * Ícones reais dos perks da Roda de Destino, baixados por scripts/fetch-wheel-icons.mjs pra
 * src/assets/wheel-icons/ — mesmo padrão de services/charm/charm-icons.ts. Cobre
 * Augmentations/Conviction único/Revelation Perks (tibiawiki.com.br) e, desde 2026-09-03,
 * também os 5 Dedication Perks + 3 dos 4 Conviction genéricos (Mana Leech/Life Leech/Skill
 * Boost, de tibia.fandom.com — confirmados pixel a pixel contra o canvas do tibiapal.com,
 * ver wheel-slice-content.ts). Só Vessel Resonance continua sem ícone próprio encontrado —
 * usa emoji (💠) como fallback, igual a qualquer id sem arquivo baixado.
 */
const iconModules = import.meta.glob<string>('/src/assets/wheel-icons/*.gif', {
  eager: true,
  import: 'default',
});

export function getWheelIconUrl(id: string): string | undefined {
  return iconModules[`/src/assets/wheel-icons/${id}.gif`];
}
