import { useEffect, useState } from 'react';
import { fetchTibiaEvents } from '@/services/supabase/tibia-events-client';
import type { TibiaEvent } from '@/types';

/** Um dia (mês/dia, sem ano) está dentro da janela recorrente de um evento?
 * Lida com eventos que cruzam a virada do ano (dezembro -> janeiro), mesmo
 * que nenhum dos eventos cadastrados hoje precise disso. */
export function isDayInTibiaEvent(month: number, day: number, event: TibiaEvent): boolean {
  const dateNum = month * 100 + day;
  const startNum = event.startMonth * 100 + event.startDay;
  const endNum = event.endMonth * 100 + event.endDay;
  if (startNum <= endNum) return dateNum >= startNum && dateNum <= endNum;
  return dateNum >= startNum || dateNum <= endNum; // evento cruza dezembro -> janeiro
}

/** Lista de eventos oficiais anuais fixos (regra do jogo, ver tibia-events-client.ts)
 * — usado pelo calendário (Histórico) pra marcar dias de evento. Dado universal,
 * busca 1x. */
export function useTibiaEvents() {
  const [events, setEvents] = useState<TibiaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTibiaEvents()
      .then((result) => {
        if (!cancelled) setEvents(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { events, loading, error };
}
