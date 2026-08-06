import { useCallback, useEffect, useState } from 'react';
import type { CreateLootDropDto, LootDrop, LootDropFilters } from '@/types';
import { repositories, LOOTDROPS_USE_SUPABASE } from '@/services/repositories';
import { SUPABASE_ACCOUNT_ID } from '@/services/supabase/supabase-account';

export function useLootDrops(accountId: string, filters?: LootDropFilters) {
  // Mesmo shim de account_id do useServiceiros — o account_id mock nao existe
  // no Supabase real (ver memoria "integracao-supabase").
  const effectiveAccountId = LOOTDROPS_USE_SUPABASE ? SUPABASE_ACCOUNT_ID : accountId;

  const [drops, setDrops] = useState<LootDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repositories.lootDrop.findByAccount(effectiveAccountId, filters);
      setDrops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar drops');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveAccountId, filters?.bossName, filters?.sold, filters?.looter, filters?.dateFrom, filters?.dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const createDrop = useCallback(async (dto: CreateLootDropDto) => {
    const created = await repositories.lootDrop.create(effectiveAccountId, dto);
    setDrops((prev) => [created, ...prev]);
    return created;
  }, [effectiveAccountId]);

  const updateDrop = useCallback(async (id: string, dto: Partial<CreateLootDropDto>) => {
    const updated = await repositories.lootDrop.update(id, dto);
    setDrops((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  }, []);

  return { drops, loading, error, createDrop, updateDrop };
}
