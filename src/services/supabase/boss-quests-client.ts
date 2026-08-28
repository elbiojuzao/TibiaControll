import { getSupabaseClient } from './supabase-client';
import { friendlyErrorMessage } from '@/services/common/friendly-supabase-error';

interface BossQuestRow {
  boss: string;
  quest: string;
}

export interface BossQuestsData {
  /** Ordem do banco (inserção) — mantém bosses da mesma quest agrupados visualmente. */
  bosses: string[];
  bossToQuest: Record<string, string>;
  /** Quests únicas, na ordem de primeira aparição. */
  quests: string[];
}

/**
 * Tabela de referência boss -> quest (migration 20260814040000_create_boss_quests_table.sql)
 * — dado público/universal do jogo, sem account_id, não passa pelo padrão repository
 * (mesma ideia do cliente TibiaData / xp-levels-client.ts).
 */
export async function fetchBossQuests(): Promise<BossQuestsData> {
  const { data, error } = await getSupabaseClient()
    .from('boss_quests')
    .select('boss, quest');
  if (error) throw new Error(friendlyErrorMessage(error));

  const rows = data as BossQuestRow[];
  const bosses: string[] = [];
  const bossToQuest: Record<string, string> = {};
  const quests: string[] = [];

  for (const row of rows) {
    bosses.push(row.boss);
    bossToQuest[row.boss] = row.quest;
    if (!quests.includes(row.quest)) quests.push(row.quest);
  }

  return { bosses, bossToQuest, quests };
}
