import { useEffect, useState } from 'react';
import type { Member } from '@/types';
import {
  fetchCharacterBasics,
  findExperienceValue,
  findSkillValue,
  resolveSkillCategory,
  SKILL_CATEGORY_LABEL,
} from '@/services/tibiadata/tibiadata-client';

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

/** Busca level real (character) + skill real (highscores) por personagem, em paralelo por membro */
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
      (async () => {
        try {
          const basics = await fetchCharacterBasics(member.characterName);
          if (!basics) {
            if (!cancelled) {
              setStats((prev) => ({
                ...prev,
                [member.characterName]: { level: null, skillLabel: null, experience: null, loading: false, unavailable: true },
              }));
            }
            return;
          }

          const category = resolveSkillCategory(member.vocation, member.skillCategory);
          const [skillValue, experience] = await Promise.all([
            findSkillValue(basics.world, category, member.characterName),
            findExperienceValue(basics.world, member.characterName),
          ]);

          if (cancelled) return;
          setStats((prev) => ({
            ...prev,
            [member.characterName]: {
              level: basics.level,
              skillLabel: skillValue !== null ? `${SKILL_CATEGORY_LABEL[category]} ${skillValue}` : null,
              experience,
              loading: false,
              unavailable: false,
            },
          }));
        } catch {
          if (!cancelled) {
            setStats((prev) => ({
              ...prev,
              [member.characterName]: { level: null, skillLabel: null, experience: null, loading: false, unavailable: true },
            }));
          }
        }
      })();
    });

    return () => { cancelled = true; };
  }, [members]);

  return stats;
}
