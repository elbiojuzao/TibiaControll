import { useCallback, useEffect, useRef, useState } from 'react';
import type { CreateMemberDto, Member } from '@/types';
import { repositories } from '@/services/repositories';

export function useMembers(accountId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Guarda contra a corrida do accountId trocando de mock pro UUID real logo após o mount
   * (useAccount() resolve a sessão de forma assíncrona) — ver mesma nota em useLootDrops.ts. */
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await repositories.member.findByAccount(accountId);
      if (requestIdRef.current === requestId) setMembers(data);
    } catch (err) {
      if (requestIdRef.current === requestId) setError(err instanceof Error ? err.message : 'Erro ao carregar membros');
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const createMember = useCallback(async (dto: CreateMemberDto) => {
    const created = await repositories.member.create(accountId, dto);
    setMembers((prev) => [...prev, created]);
    return created;
  }, [accountId]);

  const updateMember = useCallback(async (id: string, dto: Partial<CreateMemberDto>) => {
    const updated = await repositories.member.update(id, dto);
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const removeMember = useCallback(async (id: string) => {
    await repositories.member.delete(id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { members, loading, error, createMember, updateMember, removeMember };
}
