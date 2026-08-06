import type { PartySettings } from '@/types';
import type { ISettingsRepository } from '../interfaces';
import { mockPartySettings } from '@/mocks/data/party-settings';

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_SETTINGS: PartySettings = { tcGoldRate: 45_000 };

export class MockSettingsRepository implements ISettingsRepository {
  async getSettings(accountId: string): Promise<PartySettings> {
    await delay();
    return mockPartySettings[accountId] ?? DEFAULT_SETTINGS;
  }
}
