import { getSupabaseClient } from './supabase-client';
import { friendlyErrorMessage } from '@/services/common/friendly-supabase-error';

interface BossItemRow {
  boss: string;
  item: string;
}

/**
 * Loot table por boss (migration 20260814050000_create_boss_items_table.sql) — dado
 * público/universal do jogo, sem account_id, não passa pelo padrão repository (mesma ideia
 * de boss-quests-client.ts / xp-levels-client.ts).
 */
export async function fetchBossItems(): Promise<Record<string, string[]>> {
  const { data, error } = await getSupabaseClient()
    .from('boss_items')
    .select('boss, item');
  if (error) throw new Error(friendlyErrorMessage(error));

  const byBoss: Record<string, string[]> = {};
  for (const row of data as BossItemRow[]) {
    (byBoss[row.boss] ??= []).push(row.item);
  }
  return byBoss;
}
