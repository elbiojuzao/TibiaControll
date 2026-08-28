import { getSupabaseClient } from '@/services/supabase/supabase-client';
import { friendlyErrorMessage } from '@/services/common/friendly-supabase-error';
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
  hidden?: boolean;
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
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('serviceiros')
      .select('*')
      .eq('account_id', accountId)
      .eq('hidden', false)
      .order('name');
    if (error) throw new Error(friendlyErrorMessage(error));
    return (data as ServiceiroRow[]).map(toDomain);
  }

  /**
   * "Recadastro" reaproveita um serviceiro ESCONDIDO (excluído antes) com o mesmo
   * telefone nessa conta, em vez de criar um registro duplicado — pedido do usuário em
   * 2026-08-14 ("como se tivesse desexcluído"). Só telefone conta como chave de
   * reaproveitamento (é o dado estável do serviceiro); os outros campos são atualizados
   * com o que foi digitado agora.
   */
  async create(accountId: string, dto: CreateServiceiroDto): Promise<Serviceiro> {
    const supabase = getSupabaseClient();

    const { data: hiddenMatch, error: findError } = await supabase
      .from('serviceiros')
      .select('id')
      .eq('account_id', accountId)
      .eq('phone_number', dto.phoneNumber)
      .eq('hidden', true)
      .maybeSingle();
    if (findError) throw new Error(findError.message);

    if (hiddenMatch) {
      const { data, error } = await supabase
        .from('serviceiros')
        .update({ name: dto.name, character_name: dto.characterName, vocations: dto.vocations, hidden: false })
        .eq('id', hiddenMatch.id)
        .select()
        .single();
      if (error) throw new Error(friendlyErrorMessage(error));
      return toDomain(data as ServiceiroRow);
    }

    const { data, error } = await supabase
      .from('serviceiros')
      .insert({ account_id: accountId, name: dto.name, character_name: dto.characterName, phone_number: dto.phoneNumber, vocations: dto.vocations })
      .select()
      .single();
    if (error) throw new Error(friendlyErrorMessage(error));
    return toDomain(data as ServiceiroRow);
  }

  async update(id: string, dto: Partial<CreateServiceiroDto>): Promise<Serviceiro> {
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.characterName !== undefined) patch.character_name = dto.characterName;
    if (dto.phoneNumber !== undefined) patch.phone_number = dto.phoneNumber;
    if (dto.vocations !== undefined) patch.vocations = dto.vocations;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('serviceiros')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(friendlyErrorMessage(error));
    return toDomain(data as ServiceiroRow);
  }

  /**
   * "Excluir" nunca apaga a linha de verdade (pedido do usuário em 2026-08-14): só marca
   * `hidden = true`, sumindo da lista normal — o histórico em drop_services continua
   * intacto (o registro do serviceiro ainda existe, só escondido; decisão do usuário:
   * "melhor não remover [do drop] já que iremos fazer um soft delete que apenas esconde").
   * Como isso é um UPDATE, não um DELETE, o on delete restrict de
   * drop_services.serviceiro_id (migration 20260806000000) nunca chega a ser acionado. Ver
   * create() pra como um serviceiro escondido é reativado se cadastrado de novo com o
   * mesmo telefone.
   */
  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from('serviceiros').update({ hidden: true }).eq('id', id);
    if (error) throw new Error(friendlyErrorMessage(error));
  }
}
