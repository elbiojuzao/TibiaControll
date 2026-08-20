import { getSupabaseClient } from '@/services/supabase/supabase-client';
import { brToIso, isoToBr } from '@/services/common/br-date';
import type { CreateSplitLogDto, SplitLog, SplitLogMember, SplitLogTransfer, SplitLogType } from '@/types';
import type { ISplitLogRepository } from '../interfaces';

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
  created_at: string;
}

function toDomain(row: SplitLogRow): SplitLog {
  return {
    id: row.id,
    accountId: row.account_id,
    date: isoToBr(row.data),
    type: row.tipo,
    rawLog: row.log_bruto,
    members: row.membros,
    transfers: row.transferencias,
    totalBalance: row.balance_total,
    equalShare: row.cota_por_membro,
    tcRate: row.cotacao_tc,
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
