import { useCallback, useEffect, useRef, useState } from 'react';
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
  /** useAccount() troca accountId de MOCK_ACCOUNT_ID pro UUID real assim que a sessão
   * resolve — isso dispara 2 load() em sequência rápida (mount com mock + re-render com o
   * real). Sem essa guarda, se a resposta do fetch com o ID mock (que sempre falha, erro de
   * cast uuid no Postgres) chegar DEPOIS da resposta boa, ela sobrescreve o estado e a tela
   * fica presa mostrando erro mesmo com os dados certos já tendo chegado. */
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await repositories.lootDrop.findByAccount(accountId, filters);
      if (requestIdRef.current === requestId) setDrops(data);
    } catch (err) {
      if (requestIdRef.current === requestId) setError(err instanceof Error ? err.message : 'Erro ao carregar drops');
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
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

  // Excluir (soft delete, 2026-08-26, pedido do usuário) — repositories.lootDrop.delete()
  // já marca hidden=true no banco (nunca apaga de verdade, ver
  // HttpLootDropRepository/MockLootDropRepository); aqui só remove do estado local pra
  // sumir da tela na hora, sem precisar de refetch.
  const removeDrop = useCallback(async (id: string) => {
    await repositories.lootDrop.delete(id);
    setDrops((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return { drops, loading, error, createDrop, updateDrop, removeDrop };
}
