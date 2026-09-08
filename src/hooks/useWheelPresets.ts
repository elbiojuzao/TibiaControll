import { useCallback, useEffect, useState } from 'react';
import type { CreateWheelPresetDto, WheelPreset } from '@/types';
import { repositories } from '@/services/repositories';

/** Presets salvos da Roda de Destino (2026-09-08) — mesmo padrão de useMembers/
 * useServiceiros (findByAccount + create + delete, sempre um registro novo por save,
 * nunca edita um existente). */
export function useWheelPresets(accountId: string) {
  const [presets, setPresets] = useState<WheelPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accountId) {
      setPresets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await repositories.wheelPreset.findByAccount(accountId);
      setPresets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar presets salvos.');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const savePreset = useCallback(async (dto: CreateWheelPresetDto) => {
    const created = await repositories.wheelPreset.create(accountId, dto);
    setPresets((prev) => [created, ...prev]);
    return created;
  }, [accountId]);

  const deletePreset = useCallback(async (id: string) => {
    await repositories.wheelPreset.delete(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { presets, loading, error, savePreset, deletePreset };
}
