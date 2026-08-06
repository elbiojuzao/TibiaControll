import { supabase } from '@/services/supabase/supabase-client';
import type { Serviceiro, CreateServiceiroDto } from '@/types';
import type { IServiceiroRepository } from '../interfaces';

/**
 * Linha crua da tabela `serviceiros` (ver supabase/migrations/20260806000000_initial_drops_schema.sql).
 * Sem `supabase gen types typescript` rodado ainda (precisa do CLI + projeto linkado), então
 * tipamos a mão — trocar por tipos gerados quando o CLI estiver disponível.
 */
interface ServiceiroRow {
  id: string;
  account_id: string;
  name: string;
  character_name: string | null;
  phone_number: string;
  vocations: string[];
}

function toDomain(row: ServiceiroRow): Serviceiro {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    characterName: row.character_name ?? '',
    phoneNumber: row.phone_number,
    vocations: row.vocations as Serviceiro['vocations'],
  };
}

export class HttpServiceiroRepository implements IServiceiroRepository {
  async findByAccount(accountId: string): Promise<Serviceiro[]> {
    const { data, error } = await supabase
      .from('serviceiros')
      .select('*')
      .eq('account_id', accountId)
      .order('name');
    if (error) throw new Error(error.message);
    return (data as ServiceiroRow[]).map(toDomain);
  }

  async create(accountId: string, dto: CreateServiceiroDto): Promise<Serviceiro> {
    const { data, error } = await supabase
      .from('serviceiros')
      .insert({ account_id: accountId, name: dto.name, character_name: dto.characterName, phone_number: dto.phoneNumber, vocations: dto.vocations })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as ServiceiroRow);
  }

  async update(id: string, dto: Partial<CreateServiceiroDto>): Promise<Serviceiro> {
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.characterName !== undefined) patch.character_name = dto.characterName;
    if (dto.phoneNumber !== undefined) patch.phone_number = dto.phoneNumber;
    if (dto.vocations !== undefined) patch.vocations = dto.vocations;

    const { data, error } = await supabase
      .from('serviceiros')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as ServiceiroRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('serviceiros').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
