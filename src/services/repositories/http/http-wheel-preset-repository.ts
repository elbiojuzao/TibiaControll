import { getSupabaseClient } from '@/services/supabase/supabase-client';
import { friendlyErrorMessage } from '@/services/common/friendly-supabase-error';
import type { CreateWheelPresetDto, WheelPreset } from '@/types';
import type { IWheelPresetRepository } from '../interfaces';

interface WheelPresetRow {
  id: string;
  account_id: string;
  name: string;
  vocation: string;
  level: number;
  state: string;
  created_at: string;
}

function toDomain(row: WheelPresetRow): WheelPreset {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    vocation: row.vocation,
    level: row.level,
    state: row.state,
    createdAt: row.created_at,
  };
}

export class HttpWheelPresetRepository implements IWheelPresetRepository {
  async findByAccount(accountId: string): Promise<WheelPreset[]> {
    const { data, error } = await getSupabaseClient()
      .from('wheel_presets')
      .select()
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(friendlyErrorMessage(error));
    return (data as unknown as WheelPresetRow[]).map(toDomain);
  }

  async create(accountId: string, dto: CreateWheelPresetDto): Promise<WheelPreset> {
    const { data, error } = await getSupabaseClient()
      .from('wheel_presets')
      .insert({
        account_id: accountId,
        name: dto.name,
        vocation: dto.vocation,
        level: dto.level,
        state: dto.state,
      })
      .select()
      .single();
    if (error) throw new Error(friendlyErrorMessage(error));
    return toDomain(data as unknown as WheelPresetRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from('wheel_presets').delete().eq('id', id);
    if (error) throw new Error(friendlyErrorMessage(error));
  }
}
