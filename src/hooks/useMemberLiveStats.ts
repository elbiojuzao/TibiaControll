import { useEffect, useState } from 'react';
import type { Member } from '@/types';
import {
  fetchCharacterBasics,
  findExperienceValue,
  findSkillValue,
  resolveSkillCategory,
  SKILL_CATEGORY_LABEL,
} from '@/services/tibiadata/tibiadata-client';
import { fetchWithTtlCache } from '@/services/common/ttl-cache';

export interface MemberLiveStats {
  level: number | null;
  skillLabel: string | null;
  /** XP total acumulada (lifetime), via Highscores categoria "experience" — null se o
   * personagem não aparecer no recorte pesquisado (top 500). Usado pra Previsão fim de ano. */
  experience: number | null;
  loading: boolean;
  /** true quando o personagem não foi encontrado na API ou a skill não apareceu nos Highscores pesquisados */
  unavailable: boolean;
}

const LOADING_STATS: MemberLiveStats = { level: null, skillLabel: null, experience: null, loading: true, unavailable: false };
const UNAVAILABLE_STATS: MemberLiveStats = { level: null, skillLabel: null, experience: null, loading: false, unavailable: true };

const STORAGE_KEY_PREFIX = 'tibia-pts:member-live-stats-v1';
/** Level/skill/XP mudam a qualquer momento (não numa janela fixa do dia, diferente do
 * boosted creature/boss) — TTL rolante de 1h em vez de cache diário, pedido do usuário:
 * "usar o localstore de 1 em 1 hora". */
const TTL_MS = 60 * 60 * 1000;

async function fetchLiveStats(member: Member): Promise<MemberLiveStats> {
  const basics = await fetchCharacterBasics(member.characterName);
  if (!basics) return UNAVAILABLE_STATS;

  const category = resolveSkillCategory(member.vocation, member.skillCategory);
  const [skillValue, experience] = await Promise.all([
    findSkillValue(basics.world, category, member.characterName),
    findExperienceValue(basics.world, member.characterName),
  ]);

  return {
    level: basics.level,
    skillLabel: skillValue !== null ? `${SKILL_CATEGORY_LABEL[category]} ${skillValue}` : null,
    experience,
    loading: false,
    unavailable: false,
  };
}

/** Busca level real (character) + skill real (highscores) por personagem, em paralelo por
 * membro — cacheado 1h por personagem (localStorage), ver TTL_MS acima. */
export function useMemberLiveStats(members: Member[]): Record<string, MemberLiveStats> {
  const [stats, setStats] = useState<Record<string, MemberLiveStats>>({});

  useEffect(() => {
    if (members.length === 0) {
      setStats({});
      return;
    }

    let cancelled = false;
    setStats(Object.fromEntries(members.map((m) => [m.characterName, LOADING_STATS])));

    members.forEach((member) => {
      const storageKey = `${STORAGE_KEY_PREFIX}:${member.characterName}`;
      fetchWithTtlCache(storageKey, () => fetchLiveStats(member), TTL_MS)
        .then((result) => {
          if (!cancelled) setStats((prev) => ({ ...prev, [member.characterName]: result }));
        })
        .catch(() => {
          if (!cancelled) setStats((prev) => ({ ...prev, [member.characterName]: UNAVAILABLE_STATS }));
        });
    });

    return () => { cancelled = true; };
  }, [members]);

  return stats;
}
