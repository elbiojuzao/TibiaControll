import type { Member, CreateMemberDto } from '@/types';
import type { IMemberRepository } from '../interfaces';
import { mockMembers } from '@/mocks/data/members';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

let membersStore = [...mockMembers];

export class MockMemberRepository implements IMemberRepository {
  async findByAccount(accountId: string): Promise<Member[]> {
    await delay();
    return membersStore.filter((m) => m.accountId === accountId);
  }

  async create(accountId: string, dto: CreateMemberDto): Promise<Member> {
    await delay();
    const member: Member = {
      id: crypto.randomUUID(),
      accountId,
      characterName: dto.characterName,
      vocation: dto.vocation,
      isServiceiro: dto.isServiceiro ?? false,
      serviceiroSharePercent: dto.serviceiroSharePercent,
      ownerCharacterName: dto.ownerCharacterName,
      skillCategory: dto.skillCategory,
      isDefaultSeller: dto.isDefaultSeller ?? false,
    };
    membersStore.push(member);
    return member;
  }

  async update(id: string, dto: Partial<CreateMemberDto>): Promise<Member> {
    await delay();
    const index = membersStore.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Membro nao encontrado');
    membersStore[index] = { ...membersStore[index], ...dto };
    return membersStore[index];
  }

  async delete(id: string): Promise<void> {
    await delay();
    membersStore = membersStore.filter((m) => m.id !== id);
  }

  /** Util para testes — reseta o store */
  static reset(): void {
    membersStore = [...mockMembers];
  }
}
