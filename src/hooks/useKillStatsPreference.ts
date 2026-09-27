import { useEffect, useState } from 'react';
import {
  readKillStatsPreference, onKillStatsPreferenceUpdate,
  type KillStatsPreference,
} from '@/services/display/kill-stats-preference';

/** Espelha a preferência de exibição do kill statistics (localStorage, por navegador — ver
 * kill-stats-preference.ts) e atualiza sozinho quando Configurações salva uma mudança nova,
 * mesmo padrão de useAccount() com account-cache.ts. */
export function useKillStatsPreference(): KillStatsPreference {
  const [preference, setPreference] = useState<KillStatsPreference>(() => readKillStatsPreference());

  useEffect(() => onKillStatsPreferenceUpdate(setPreference), []);

  return preference;
}
