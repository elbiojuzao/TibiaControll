import type { IndividualSplit } from '@/types';
import type { ISplitRepository } from '../interfaces';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

const splitsStore = new Map<string, IndividualSplit[]>();

export class MockSplitRepository implements ISplitRepository {
  async saveSplit(huntId: string, splits: IndividualSplit[]): Promise<void> {
    await delay();
    splitsStore.set(huntId, splits);
  }

  async findByHunt(huntId: string): Promise<IndividualSplit[]> {
    await delay();
    return splitsStore.get(huntId) ?? [];
  }
}
