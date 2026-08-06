import manifest from '@/assets/item-icons/manifest.json';

/**
 * Ícones reais dos itens (sprites do TibiaWiki), baixados por scripts/fetch-item-icons.mjs
 * pra src/assets/item-icons/. manifest.json mapeia nome exato do item -> nome do arquivo.
 * Reaproveitável em qualquer tela que precise mostrar o ícone de um item pelo nome.
 */
const iconModules = import.meta.glob<string>('/src/assets/item-icons/*.gif', {
  eager: true,
  import: 'default',
});

const nameToUrl: Record<string, string> = {};
for (const [itemName, filename] of Object.entries(manifest as Record<string, string>)) {
  const url = iconModules[`/src/assets/item-icons/${filename}`];
  if (url) nameToUrl[itemName] = url;
}

/** URL do ícone real do item, ou undefined se não tiver sido baixado ainda (ver script de fetch). */
export function getItemIconUrl(itemName: string): string | undefined {
  return nameToUrl[itemName];
}
