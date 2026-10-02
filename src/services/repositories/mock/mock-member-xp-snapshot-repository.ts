import type { XpCharacterStats } from '@/types';
import type { IMemberXpSnapshotRepository } from '../interfaces';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

/** Sem histórico de XP em modo mock — o Dashboard cai nos valores de mockMemberXpStats e as
 * telas de Histórico de XP/Calendário mostram "—". */
export class MockMemberXpSnapshotRepository implements IMemberXpSnapshotRepository {
  async getSeries(): Promise<Record<string, XpCharacterStats>> {
    await delay();
    return {};
  }
}
