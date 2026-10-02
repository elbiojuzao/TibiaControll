import { getSupabaseClient } from '@/services/supabase/supabase-client';
import { friendlyErrorMessage } from '@/services/common/friendly-supabase-error';
import type { Member, CreateMemberDto, HighscoreSkillCategory } from '@/types';
import type { IMemberRepository } from '../interfaces';

interface MemberRow {
  id: string;
  account_id: string;
  character_name: string;
  nomes_antigos: string[];
  vocation: Member['vocation'];
  is_serviceiro: boolean;
  serviceiro_share_percent: number | null;
  owner_character_name: string | null;
  skill_category: HighscoreSkillCategory | null;
  is_default_seller: boolean;
}

function toDomain(row: MemberRow): Member {
  return {
    id: row.id,
    accountId: row.account_id,
    characterName: row.character_name,
    previousNames: row.nomes_antigos ?? [],
    vocation: row.vocation,
    isServiceiro: row.is_serviceiro,
    serviceiroSharePercent: row.serviceiro_share_percent ?? undefined,
    ownerCharacterName: row.owner_character_name ?? undefined,
    skillCategory: row.skill_category ?? undefined,
    isDefaultSeller: row.is_default_seller,
  };
}

export class HttpMemberRepository implements IMemberRepository {
  async findByAccount(accountId: string): Promise<Member[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('account_id', accountId)
      .order('character_name');
    if (error) throw new Error(friendlyErrorMessage(error));
    return (data as MemberRow[]).map(toDomain);
  }

  async create(accountId: string, dto: CreateMemberDto): Promise<Member> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('members')
      .insert({
        account_id: accountId,
        character_name: dto.characterName,
        vocation: dto.vocation,
        is_serviceiro: dto.isServiceiro ?? false,
        serviceiro_share_percent: dto.serviceiroSharePercent,
        owner_character_name: dto.ownerCharacterName,
        skill_category: dto.skillCategory,
        is_default_seller: dto.isDefaultSeller ?? false,
      })
      .select()
      .single();
    if (error) throw new Error(friendlyErrorMessage(error));
    return toDomain(data as MemberRow);
  }

  async update(id: string, dto: Partial<CreateMemberDto>): Promise<Member> {
    const supabase = getSupabaseClient();
    const patch: Record<string, unknown> = {};
    if (dto.characterName !== undefined) {
      // Rename no jogo: guarda o nome antigo em nomes_antigos pra não perder o vínculo com o
      // histórico (dados novos usam member_id, mas splits/drops antigos ainda casam por nome).
      const { data: current, error: currentError } = await supabase
        .from('members')
        .select('character_name, nomes_antigos')
        .eq('id', id)
        .single();
      if (currentError) throw new Error(friendlyErrorMessage(currentError));
      const { character_name: oldName, nomes_antigos: oldNames } = current as Pick<MemberRow, 'character_name' | 'nomes_antigos'>;
      patch.character_name = dto.characterName;
      if (oldName !== dto.characterName) {
        const history = oldNames ?? [];
        patch.nomes_antigos = history.includes(oldName) ? history : [...history, oldName];
      }
    }
    if (dto.vocation !== undefined) patch.vocation = dto.vocation;
    if (dto.isServiceiro !== undefined) patch.is_serviceiro = dto.isServiceiro;
    if (dto.serviceiroSharePercent !== undefined) patch.serviceiro_share_percent = dto.serviceiroSharePercent;
    if (dto.ownerCharacterName !== undefined) patch.owner_character_name = dto.ownerCharacterName;
    if (dto.skillCategory !== undefined) patch.skill_category = dto.skillCategory;
    if (dto.isDefaultSeller !== undefined) patch.is_default_seller = dto.isDefaultSeller;

    const { data, error } = await supabase
      .from('members')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(friendlyErrorMessage(error));
    return toDomain(data as MemberRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from('members').delete().eq('id', id);
    if (error) throw new Error(friendlyErrorMessage(error));
  }
}
