import { getSupabaseClient } from '@/services/supabase/supabase-client';
import type { Member, CreateMemberDto, HighscoreSkillCategory } from '@/types';
import type { IMemberRepository } from '../interfaces';

interface MemberRow {
  id: string;
  account_id: string;
  character_name: string;
  vocation: Member['vocation'];
  is_serviceiro: boolean;
  serviceiro_share_percent: number | null;
  owner_character_name: string | null;
  skill_category: HighscoreSkillCategory | null;
}

function toDomain(row: MemberRow): Member {
  return {
    id: row.id,
    accountId: row.account_id,
    characterName: row.character_name,
    vocation: row.vocation,
    isServiceiro: row.is_serviceiro,
    serviceiroSharePercent: row.serviceiro_share_percent ?? undefined,
    ownerCharacterName: row.owner_character_name ?? undefined,
    skillCategory: row.skill_category ?? undefined,
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
    if (error) throw new Error(error.message);
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
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as MemberRow);
  }

  async update(id: string, dto: Partial<CreateMemberDto>): Promise<Member> {
    const patch: Record<string, unknown> = {};
    if (dto.characterName !== undefined) patch.character_name = dto.characterName;
    if (dto.vocation !== undefined) patch.vocation = dto.vocation;
    if (dto.isServiceiro !== undefined) patch.is_serviceiro = dto.isServiceiro;
    if (dto.serviceiroSharePercent !== undefined) patch.serviceiro_share_percent = dto.serviceiroSharePercent;
    if (dto.ownerCharacterName !== undefined) patch.owner_character_name = dto.ownerCharacterName;
    if (dto.skillCategory !== undefined) patch.skill_category = dto.skillCategory;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('members')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as MemberRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from('members').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
