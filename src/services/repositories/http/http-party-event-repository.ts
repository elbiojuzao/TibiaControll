import { getSupabaseClient } from '@/services/supabase/supabase-client';
import { friendlyErrorMessage } from '@/services/common/friendly-supabase-error';
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
    if (error) throw new Error(friendlyErrorMessage(error));
    return toDomain(data as unknown as PartyEventRow);
  }

  /** Mural: todo mundo autenticado lê todos os eventos, não só os da própria conta (RLS
   * "party_events_select_all", migration 20260828000000) — quem RESTRINGE é o `create`
   * (só conta admin), não a leitura. */
  async findAll(): Promise<PartyEvent[]> {
    const { data, error } = await getSupabaseClient()
      .from('party_events')
      .select()
      .order('start_date', { ascending: false });
    if (error) throw new Error(friendlyErrorMessage(error));
    return (data as unknown as PartyEventRow[]).map(toDomain);
  }

  async update(id: string, dto: Partial<CreatePartyEventDto>): Promise<PartyEvent> {
    const patch: Record<string, unknown> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.startDate !== undefined) patch.start_date = brToIso(dto.startDate);
    if (dto.endDate !== undefined) patch.end_date = brToIso(dto.endDate);
    if (dto.categories !== undefined) patch.categories = dto.categories;

    const { data, error } = await getSupabaseClient()
      .from('party_events')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(friendlyErrorMessage(error));
    return toDomain(data as unknown as PartyEventRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from('party_events').delete().eq('id', id);
    if (error) throw new Error(friendlyErrorMessage(error));
  }
}
