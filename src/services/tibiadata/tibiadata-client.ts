/**
 * Cliente para a API pública do TibiaData (https://tibiadata.com), usada só pra dados globais
 * do jogo (boss/criatura bostados do dia, level/skill de personagem). Diferente do resto do
 * app, isso não passa pelo container de `repositories` (mock/HTTP) porque não é dado da
 * conta/party — é dado público do Tibia, sem necessidade de mock.
 */
import type { HighscoreSkillCategory } from '@/types';

const BASE_URL = 'https://api.tibiadata.com/v4';

/**
 * Highscores só listam o top 1000 (20 páginas de 50) de cada categoria por mundo. Personagens
 * fora desse recorte não têm skill recuperável por essa via — limitamos a busca a este teto
 * pra não varrer o mundo inteiro à toa. Ajustar aqui se precisar cobrir personagens mais fracos.
 */
const HIGHSCORE_SEARCH_PAGE_CAP = 10;

export const SKILL_CATEGORY_LABEL: Record<HighscoreSkillCategory, string> = {
  magiclevel: 'ML',
  axefighting: 'Axe',
  swordfighting: 'Sword',
  clubfighting: 'Club',
  distancefighting: 'Distance',
};

export interface BoostedEntry {
  name: string;
  imageUrl: string;
}

interface TibiaDataCreaturesResponse {
  creatures: {
    boosted: { name: string; race: string; image_url: string; featured: boolean };
  };
}

interface TibiaDataBoostableBossesResponse {
  boostable_bosses: {
    boosted: { name: string; image_url: string; featured: boolean };
  };
}

export async function fetchBoostedCreature(): Promise<BoostedEntry> {
  const res = await fetch(`${BASE_URL}/creatures`);
  if (!res.ok) throw new Error('Falha ao buscar criatura bostada do dia');
  const data: TibiaDataCreaturesResponse = await res.json();
  const { boosted } = data.creatures;
  return { name: boosted.name, imageUrl: boosted.image_url };
}

export async function fetchBoostedBoss(): Promise<BoostedEntry> {
  const res = await fetch(`${BASE_URL}/boostablebosses`);
  if (!res.ok) throw new Error('Falha ao buscar boss bostado do dia');
  const data: TibiaDataBoostableBossesResponse = await res.json();
  const { boosted } = data.boostable_bosses;
  return { name: boosted.name, imageUrl: boosted.image_url };
}

export interface CharacterBasics {
  level: number;
  vocation: string;
  world: string;
}

interface TibiaDataCharacterResponse {
  character: {
    character?: { level: number; vocation: string; world: string };
  };
}

/** Retorna null se o personagem não existir/não for encontrado (não lança erro nesse caso) */
export async function fetchCharacterBasics(characterName: string): Promise<CharacterBasics | null> {
  const res = await fetch(`${BASE_URL}/character/${encodeURIComponent(characterName)}`);
  if (!res.ok) return null;
  const data: TibiaDataCharacterResponse = await res.json();
  const char = data.character?.character;
  if (!char?.level) return null;
  return { level: char.level, vocation: char.vocation, world: char.world };
}

interface TibiaDataHighscoresResponse {
  highscores: {
    highscore_list: { name: string; value: number }[];
    highscore_page: { current_page: number; total_pages: number };
  };
}

/**
 * Varre os Highscores do mundo/categoria em busca do personagem, página por página, até achar
 * ou atingir HIGHSCORE_SEARCH_PAGE_CAP. Retorna o valor de skill (não o rank) ou null se não
 * encontrado dentro do teto de busca.
 */
export async function findSkillValue(
  world: string,
  category: HighscoreSkillCategory,
  characterName: string,
): Promise<number | null> {
  const targetName = characterName.toLowerCase();

  for (let page = 1; page <= HIGHSCORE_SEARCH_PAGE_CAP; page++) {
    const res = await fetch(`${BASE_URL}/highscores/${encodeURIComponent(world)}/${category}/all/${page}`);
    if (!res.ok) return null;
    const data: TibiaDataHighscoresResponse = await res.json();
    const { highscore_list: list, highscore_page: pageInfo } = data.highscores;

    const found = list.find((p) => p.name.toLowerCase() === targetName);
    if (found) return found.value;
    if (page >= pageInfo.total_pages) break;
  }

  return null;
}

/** Deriva a categoria de Highscore a consultar a partir da vocação, quando o Member não define uma explícita */
export function resolveSkillCategory(vocation: string, override?: HighscoreSkillCategory): HighscoreSkillCategory {
  if (override) return override;
  switch (vocation) {
    case 'ED':
    case 'MS':
      return 'magiclevel';
    case 'RP':
      return 'distancefighting';
    case 'EK':
    default:
      return 'axefighting';
  }
}
