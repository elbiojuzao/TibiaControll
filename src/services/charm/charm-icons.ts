/**
 * Ícones reais das runas de Charm (TibiaWiki), baixados por scripts/fetch-charm-icons.mjs
 * pra src/assets/charm-icons/ — um arquivo por charm, nomeado com o mesmo `id` usado em
 * charm-data.ts (não precisa de manifest.json como item-icons.ts, já que a lista de
 * charms é fixa e o nome do arquivo já É o id).
 */
const iconModules = import.meta.glob<string>('/src/assets/charm-icons/*.gif', {
  eager: true,
  import: 'default',
});

/** URL do ícone real da runa pelo charmId, ou undefined se não tiver sido baixado ainda. */
export function getCharmIconUrl(charmId: string): string | undefined {
  return iconModules[`/src/assets/charm-icons/${charmId}.gif`];
}
