import { useCallback, useEffect, useState } from 'react';
import { repositories } from '@/services/repositories';
import type { CreatePartyEventDto, PartyEvent } from '@/types';

/** Eventos cadastrados manualmente pelo usuário no Calendário (2026-08-25, pedido do
 * usuário: "o botao de adicionar novo evento que abre a modal e o usuario vai digitar
 * sobre o evento e cadastrar") — diferente de useTibiaEvents (eventos oficiais do jogo,
 * sem account_id). */
export function usePartyEvents(accountId: string) {
  const [events, setEvents] = useState<PartyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    repositories.partyEvent
      .findByAccount(accountId)
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [accountId]);

  const createEvent = useCallback(async (dto: CreatePartyEventDto) => {
    const created = await repositories.partyEvent.create(accountId, dto);
    setEvents((prev) => [created, ...prev]);
    return created;
  }, [accountId]);

  return { events, loading, error, createEvent };
}
