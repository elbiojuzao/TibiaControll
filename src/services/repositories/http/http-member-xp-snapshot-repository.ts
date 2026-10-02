import { getSupabaseClient } from '@/services/supabase/supabase-client';
import { friendlyErrorMessage } from '@/services/common/friendly-supabase-error';
import { isoToBr } from '@/services/common/br-date';
import type { XpCharacterStats, XpDailyEntry } from '@/types';
import type { IMemberXpSnapshotRepository } from '../interfaces';

/** PostgREST devolve no máximo 1000 linhas por request — o histórico já passa disso
 * (4 personagens × 665+ dias), então a leitura pagina. */
const PAGE_SIZE = 1000;

interface SnapshotRow {
  member_id: string;
  data: string; // YYYY-MM-DD
  xp_ganho: number | null;
}

interface MemberNameRow {
  id: string;
  character_name: string;
}

function sumLast(series: XpDailyEntry[], days: number): number {
  return series.slice(-days).reduce((sum, e) => sum + e.value, 0);
}

export class HttpMemberXpSnapshotRepository implements IMemberXpSnapshotRepository {
  async getSeries(accountId: string): Promise<Record<string, XpCharacterStats>> {
    const supabase = getSupabaseClient();

    // Chave do resultado = nome ATUAL do membro (join em memória por member_id), não o
    // character_name gravado em cada snapshot — assim um personagem renomeado continua
    // com o histórico inteiro sob o nome novo.
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, character_name')
      .eq('account_id', accountId);
    if (membersError) throw new Error(friendlyErrorMessage(membersError));
    const nameById = new Map((members as MemberNameRow[]).map((m) => [m.id, m.character_name]));

    const rows: SnapshotRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('member_xp_snapshots')
        .select('member_id, data, xp_ganho')
        .eq('account_id', accountId)
        .not('xp_ganho', 'is', null)
        .order('data', { ascending: true })
        .order('member_id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw new Error(friendlyErrorMessage(error));
      const page = data as SnapshotRow[];
      rows.push(...page);
      if (page.length < PAGE_SIZE) break;
    }

    const seriesByName = new Map<string, XpDailyEntry[]>();
    for (const row of rows) {
      const name = nameById.get(row.member_id);
      if (!name || row.xp_ganho === null) continue;
      const list = seriesByName.get(name) ?? [];
      list.push({ date: isoToBr(row.data), value: Number(row.xp_ganho) });
      seriesByName.set(name, list);
    }

    const result: Record<string, XpCharacterStats> = {};
    for (const [name, series] of seriesByName) {
      result[name] = {
        xpOntem: series[series.length - 1]?.value ?? 0,
        xp30Dias: sumLast(series, 30),
        xp90Dias: sumLast(series, 90),
        series,
      };
    }
    return result;
  }
}
