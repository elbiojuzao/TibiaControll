import { useCallback, useEffect, useState } from 'react';
import type { CreateServiceiroDto, Serviceiro } from '@/types';
import { repositories } from '@/services/repositories';

/** accountId já vem resolvido de verdade por useAccount() (Supabase Auth + RLS, ver
 * migration 20260814000000_enable_rls_with_auth.sql) quando ACCOUNT_USE_SUPABASE está
 * ligado — não precisa mais de um account_id fixo aqui (era uma gambiarra temporária até
 * o Auth existir de verdade, ver memória "integracao-supabase"). */
export function useServiceiros(accountId: string) {
  const [serviceiros, setServiceiros] = useState<Serviceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repositories.serviceiro.findByAccount(accountId);
      setServiceiros(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar serviceiros');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const createServiceiro = useCallback(async (dto: CreateServiceiroDto) => {
    const created = await repositories.serviceiro.create(accountId, dto);
    setServiceiros((prev) => [...prev, created]);
    return created;
  }, [accountId]);

  const updateServiceiro = useCallback(async (id: string, dto: Partial<CreateServiceiroDto>) => {
    const updated = await repositories.serviceiro.update(id, dto);
    setServiceiros((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const removeServiceiro = useCallback(async (id: string) => {
    await repositories.serviceiro.delete(id);
    setServiceiros((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { serviceiros, loading, error, createServiceiro, updateServiceiro, removeServiceiro };
}
