import { useCallback, useEffect, useState } from 'react';
import type { CreateWheelBuildDto, WheelBuild } from '@/types';
import { repositories } from '@/services/repositories';

/** Builds salvos da Roda de Destino (2026-09-02) — mesmo padrão de useMembers/useServiceiros
 * (findByAccount + create + delete, sempre um registro novo por save, nunca edita um
 * existente). */
export function useWheelBuilds(accountId: string) {
  const [builds, setBuilds] = useState<WheelBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accountId) {
      setBuilds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await repositories.wheelBuild.findByAccount(accountId);
      setBuilds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar builds salvos.');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveBuild = useCallback(async (dto: CreateWheelBuildDto) => {
    const created = await repositories.wheelBuild.create(accountId, dto);
    setBuilds((prev) => [created, ...prev]);
    return created;
  }, [accountId]);

  const deleteBuild = useCallback(async (id: string) => {
    await repositories.wheelBuild.delete(id);
    setBuilds((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { builds, loading, error, saveBuild, deleteBuild };
}
