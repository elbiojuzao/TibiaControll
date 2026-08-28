import { getSupabaseClient } from './supabase-client';
import { friendlyErrorMessage } from '@/services/common/friendly-supabase-error';

interface XpLevelRow {
  level: number;
  xp_total: number;
}

/**
 * Tabela de referência de XP por nível (fórmula oficial do Tibia, ver migration
 * 20260814020000_create_xp_levels_table.sql) — dado público/universal do jogo, sem
 * account_id, não passa pelo padrão repository (mesma ideia do cliente TibiaData).
 */
export async function fetchXpLevels(): Promise<Record<number, number>> {
  const { data, error } = await getSupabaseClient()
    .from('xp_levels')
    .select('level, xp_total')
    .order('level');
  if (error) throw new Error(friendlyErrorMessage(error));

  const byLevel: Record<number, number> = {};
  for (const row of data as XpLevelRow[]) {
    byLevel[row.level] = row.xp_total;
  }
  return byLevel;
}
