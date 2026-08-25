import { getSupabaseClient } from '@/services/supabase/supabase-client';
import { brToIso, isoToBr } from '@/services/common/br-date';
import type { CreatePartyEventDto, PartyEvent, PartyEventCategory } from '@/types';
import type { IPartyEventRepository } from '../interfaces';

interface PartyEventRow {
  id: string;
  account_id: string;
  title: string;
  description: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  categories: PartyEventCategory[];
  created_at: string;
}

function toDomain(row: PartyEventRow): PartyEvent {
  return {
    id: row.id,
    accountId: row.account_id,
    title: row.title,
    description: row.description,
    startDate: isoToBr(row.start_date),
    endDate: isoToBr(row.end_date),
    categories: row.categories ?? [],
    createdAt: row.created_at,
  };
}

export class HttpPartyEventRepository implements IPartyEventRepository {
  async create(accountId: string, dto: CreatePartyEventDto): Promise<PartyEvent> {
    const { data, error } = await getSupabaseClient()
      .from('party_events')
      .insert({
        account_id: accountId,
        title: dto.title,
        description: dto.description,
        start_date: brToIso(dto.startDate),
        end_date: brToIso(dto.endDate),
        categories: dto.categories,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as PartyEventRow);
  }

  async findByAccount(accountId: string): Promise<PartyEvent[]> {
    const { data, error } = await getSupabaseClient()
      .from('party_events')
      .select()
      .eq('account_id', accountId)
      .order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as unknown as PartyEventRow[]).map(toDomain);
  }
}
