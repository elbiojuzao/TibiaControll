import { useCallback, useEffect, useState } from 'react';
import { repositories } from '@/services/repositories';
import type { CreatePartyEventDto, PartyEvent } from '@/types';

/** Mural de eventos (2026-08-25, pedido do usuário; redesenhado em 2026-08-28 pra virar
 * mural visível a todo mundo, só conta Admin cria — ver [[modulo-eventos-party]]) —
 * diferente de useTibiaEvents (eventos oficiais do jogo, sem account_id nem admin). Leitura
 * (`findAll`) não depende mais de `accountId` — só a criação (`create`) usa, pra gravar
 * quem cadastrou. */
export function usePartyEvents(accountId: string) {
  const [events, setEvents] = useState<PartyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    repositories.partyEvent
      .findAll()
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
  }, []);

  const createEvent = useCallback(async (dto: CreatePartyEventDto) => {
    const created = await repositories.partyEvent.create(accountId, dto);
    setEvents((prev) => [created, ...prev]);
    return created;
  }, [accountId]);

  const updateEvent = useCallback(async (id: string, dto: Partial<CreatePartyEventDto>) => {
    const updated = await repositories.partyEvent.update(id, dto);
    setEvents((prev) => prev.map((ev) => (ev.id === id ? updated : ev)));
    return updated;
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await repositories.partyEvent.delete(id);
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  }, []);

  return { events, loading, error, createEvent, updateEvent, deleteEvent };
}
