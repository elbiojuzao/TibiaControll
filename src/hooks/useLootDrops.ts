import { useCallback, useEffect, useState } from 'react';
import type { CreateLootDropDto, LootDrop, LootDropFilters } from '@/types';
import { repositories } from '@/services/repositories';

/** accountId já vem resolvido de verdade por useAccount() (Supabase Auth + RLS, ver
 * migration 20260814000000_enable_rls_with_auth.sql) quando ACCOUNT_USE_SUPABASE está
 * ligado — não precisa mais de um account_id fixo aqui (era uma gambiarra temporária até
 * o Auth existir de verdade, ver memória "integracao-supabase"). */
export function useLootDrops(accountId: string, filters?: LootDropFilters) {
  const [drops, setDrops] = useState<LootDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repositories.lootDrop.findByAccount(accountId, filters);
      setDrops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar drops');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, filters?.bossName, filters?.sold, filters?.looter, filters?.dateFrom, filters?.dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const createDrop = useCallback(async (dto: CreateLootDropDto) => {
    const created = await repositories.lootDrop.create(accountId, dto);
    setDrops((prev) => [created, ...prev]);
    return created;
  }, [accountId]);

  const updateDrop = useCallback(async (id: string, dto: Partial<CreateLootDropDto>) => {
    const updated = await repositories.lootDrop.update(id, dto);
    setDrops((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  }, []);

  return { drops, loading, error, createDrop, updateDrop };
}
