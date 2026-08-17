import { getSupabaseClient } from './supabase-client';
import type { TibiaEvent, TibiaEventCategory } from '@/types';

interface TibiaEventRow {
  id: string;
  name: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  categories: TibiaEventCategory[];
  description: string;
}

/**
 * Tabela de referência de eventos oficiais anuais da CipSoft (migration
 * 20260817010000_create_tibia_events_table.sql) — dado público/universal do
 * jogo, sem account_id, não passa pelo padrão repository (mesma ideia do
 * boss-quests-client.ts / xp-levels-client.ts).
 */
export async function fetchTibiaEvents(): Promise<TibiaEvent[]> {
  const { data, error } = await getSupabaseClient()
    .from('tibia_events')
    .select('id, name, start_month, start_day, end_month, end_day, categories, description');
  if (error) throw new Error(error.message);

  return (data as TibiaEventRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    startMonth: row.start_month,
    startDay: row.start_day,
    endMonth: row.end_month,
    endDay: row.end_day,
    categories: row.categories,
    description: row.description,
  }));
}
