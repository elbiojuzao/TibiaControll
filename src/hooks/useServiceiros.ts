import { useCallback, useEffect, useState } from 'react';
import type { CreateServiceiroDto, Serviceiro } from '@/types';
import { repositories, SERVICEIROS_USE_SUPABASE } from '@/services/repositories';
import { SUPABASE_ACCOUNT_ID } from '@/services/supabase/supabase-account';

export function useServiceiros(accountId: string) {
  // Quando o repositorio de serviceiro esta no Supabase real, o account_id
  // mock ('acc-demo-001') nao existe la — usa o account_id real fixo ate a
  // autenticacao ser migrada (ver memoria "integracao-supabase").
  const effectiveAccountId = SERVICEIROS_USE_SUPABASE ? SUPABASE_ACCOUNT_ID : accountId;

  const [serviceiros, setServiceiros] = useState<Serviceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repositories.serviceiro.findByAccount(effectiveAccountId);
      setServiceiros(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar serviceiros');
    } finally {
      setLoading(false);
    }
  }, [effectiveAccountId]);

  useEffect(() => {
    load();
  }, [load]);

  const createServiceiro = useCallback(async (dto: CreateServiceiroDto) => {
    const created = await repositories.serviceiro.create(effectiveAccountId, dto);
    setServiceiros((prev) => [...prev, created]);
    return created;
  }, [effectiveAccountId]);

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
