import { getSupabaseClient } from '@/services/supabase/supabase-client';
import { brToIso, isoToBr } from '@/services/common/br-date';
import type { CreateSplitLogDto, SplitLog, SplitLogMember, SplitLogPlayerSlot, SplitLogTransfer, SplitLogType } from '@/types';
import type { ISplitLogRepository } from '../interfaces';

/** Até 8 colunas rígidas de player em split_logs (migration 20260822000000, pedido do
 * usuário: "colocar até 8 colunas de player nunca vai ter mais que isso"). */
const PLAYER_SLOT_COUNT = 8;

interface SplitLogRow {
  id: string;
  account_id: string;
  data: string; // YYYY-MM-DD
  tipo: SplitLogType;
  log_bruto: string;
  membros: SplitLogMember[];
  transferencias: SplitLogTransfer[];
  balance_total: number;
  cota_por_membro: number;
  cotacao_tc: number;
  duracao_minutos: number | null;
  created_at: string;
  // player1_nome/player1_dano/player1_cura ... player8_* — indexados dinamicamente abaixo
  // via `row[\`player${i}_nome\`]`, não listados campo a campo aqui.
  [key: `player${number}_nome`]: string | null;
  [key: `player${number}_dano`]: number | null;
  [key: `player${number}_cura`]: number | null;
}

/** Monta as colunas player1_nome/_dano/_cura ... player8_* pro INSERT, a partir dos
 * primeiros 8 `members` — slots sem jogador ficam NULL (nunca omitidos, pra um insert
 * futuro com menos membros não deixar lixo de um valor antigo caso vire update um dia). */
function buildPlayerSlotColumns(members: SplitLogMember[]): Record<string, string | number | null> {
  const cols: Record<string, string | number | null> = {};
  for (let i = 1; i <= PLAYER_SLOT_COUNT; i++) {
    const m = members[i - 1];
    cols[`player${i}_nome`] = m?.name ?? null;
    cols[`player${i}_dano`] = m ? m.damage : null;
    cols[`player${i}_cura`] = m ? m.healing : null;
  }
  return cols;
}

/** Lê as colunas player1_*..player8_* de volta pro array `playerSlots` — pula slots vazios
 * (nome null), tanto pra splits com menos de 8 membros quanto pra registros salvos antes da
 * migration 20260822000000 (todas as colunas ficam NULL nesses casos). */
function readPlayerSlots(row: SplitLogRow): SplitLogPlayerSlot[] {
  const slots: SplitLogPlayerSlot[] = [];
  for (let i = 1; i <= PLAYER_SLOT_COUNT; i++) {
    const name = row[`player${i}_nome`];
    if (!name) continue;
    slots.push({ name, damage: row[`player${i}_dano`] ?? 0, healing: row[`player${i}_cura`] ?? 0 });
  }
  return slots;
}

function toDomain(row: SplitLogRow): SplitLog {
  return {
    id: row.id,
    accountId: row.account_id,
    date: isoToBr(row.data),
    type: row.tipo,
    rawLog: row.log_bruto,
    // damage/healing só existem no JSONB pra splits salvos a partir de 2026-08-21 —
    // registros mais antigos (import de CSV, splits salvos antes disso) não têm essas
    // chaves; default 0 aqui em vez de deixar undefined vazar pro domínio (que declara
    // number, não number|undefined).
    members: row.membros.map((m) => ({ ...m, damage: m.damage ?? 0, healing: m.healing ?? 0 })),
    playerSlots: readPlayerSlots(row),
    transfers: row.transferencias,
    totalBalance: row.balance_total,
    equalShare: row.cota_por_membro,
    tcRate: row.cotacao_tc,
    durationMinutes: row.duracao_minutos,
    createdAt: row.created_at,
  };
}

export class HttpSplitLogRepository implements ISplitLogRepository {
  async create(accountId: string, dto: CreateSplitLogDto): Promise<SplitLog> {
    const { data, error } = await getSupabaseClient()
      .from('split_logs')
      .insert({
        account_id: accountId,
        data: brToIso(dto.date),
        tipo: dto.type,
        log_bruto: dto.rawLog,
        membros: dto.members,
        transferencias: dto.transfers,
        balance_total: dto.totalBalance,
        cota_por_membro: dto.equalShare,
        cotacao_tc: dto.tcRate,
        duracao_minutos: dto.durationMinutes,
        ...buildPlayerSlotColumns(dto.members),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as SplitLogRow);
  }

  async findByAccount(accountId: string): Promise<SplitLog[]> {
    const { data, error } = await getSupabaseClient()
      .from('split_logs')
      .select()
      .eq('account_id', accountId)
      .eq('hidden', false)
      .order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as unknown as SplitLogRow[]).map(toDomain);
  }

  /** Soft delete (2026-08-19/20, pedido do usuário) — nunca apaga a linha de verdade, só
   * marca hidden=true. Pode existir mais de um split do mesmo tipo no mesmo dia, então
   * esconde TODOS de uma vez (o modal do Calendário mostra a soma agregada do dia, não um
   * registro específico — não faz sentido "excluir só um" a partir dessa tela). */
  async hide(accountId: string, date: string, type: SplitLogType): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('split_logs')
      .update({ hidden: true })
      .eq('account_id', accountId)
      .eq('data', brToIso(date))
      .eq('tipo', type);
    if (error) throw new Error(error.message);
  }
}
