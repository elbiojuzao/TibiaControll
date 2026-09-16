import { useEffect, useState } from 'react';
import { fetchCreatureKillStatsCached } from '@/services/tibiadata/creature-kill-stats-cache';
import type { CreatureKillStats } from '@/services/tibiadata/tibiadata-client';

/** `world` vem de accounts.world (Configurações) — undefined/vazio até o usuário
 * configurar, e nesse caso não faz fetch nenhum (evita bater na API com um mundo errado). */
export function useCreatureKillStats(world: string | undefined, creatureName: string) {
  const [stats, setStats] = useState<CreatureKillStats | null>(null);
  const [loading, setLoading] = useState(!!world);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!world) {
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCreatureKillStatsCached(world, creatureName)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao buscar dados do TibiaData');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [world, creatureName]);

  return { stats, loading, error };
}
