/**
 * Consulta de XP total (lifetime) nos Highscores do TibiaData, versão server-side usada pelo
 * cron api/cron/xp-collect. Cópia enxuta de findExperienceValue/fetchCharacterBasics de
 * src/services/tibiadata/tibiadata-client.ts — api/_lib é auto-contido de propósito (mesma
 * convenção de sheet-utils.ts): não importa nada de src/, que é código do bundle do client.
 */
const BASE_URL = 'https://api.tibiadata.com/v4';

/** Mesmo teto do client (10 páginas de 50 = top 500 do mundo). */
const HIGHSCORE_SEARCH_PAGE_CAP = 10;

interface TibiaDataHighscoresResponse {
  highscores: {
    highscore_list: { name: string; value: number }[];
    highscore_page: { current_page: number; total_pages: number };
  };
}

interface TibiaDataCharacterResponse {
  character: { character?: { world: string } };
}

/** Mundo do personagem, ou null se não existir. Só usado quando accounts.world está vazio. */
export async function fetchCharacterWorld(characterName: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/character/${encodeURIComponent(characterName)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as TibiaDataCharacterResponse;
  return data.character?.character?.world ?? null;
}

/** Páginas já baixadas numa execução (chave "mundo:página") — personagens do mesmo mundo
 * leem as mesmas páginas, então o cron passa um cache pra não repetir requests. */
export type HighscorePageCache = Map<string, TibiaDataHighscoresResponse | null>;

/** XP total acumulada do personagem, ou null se não aparecer no top pesquisado do mundo. */
export async function findExperienceValue(
  world: string,
  characterName: string,
  pageCache: HighscorePageCache = new Map(),
): Promise<number | null> {
  const targetName = characterName.toLowerCase();

  for (let page = 1; page <= HIGHSCORE_SEARCH_PAGE_CAP; page++) {
    const cacheKey = `${world}:${page}`;
    let data = pageCache.get(cacheKey);
    if (data === undefined) {
      const res = await fetch(`${BASE_URL}/highscores/${encodeURIComponent(world)}/experience/all/${page}`);
      data = res.ok ? ((await res.json()) as TibiaDataHighscoresResponse) : null;
      pageCache.set(cacheKey, data);
    }
    if (!data) return null;
    const { highscore_list: list, highscore_page: pageInfo } = data.highscores;

    const found = list.find((p) => p.name.toLowerCase() === targetName);
    if (found) return found.value;
    if (page >= pageInfo.total_pages) break;
  }

  return null;
}
