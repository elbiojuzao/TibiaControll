/**
 * Factory de repositorios — trocar `useMock: false` e implementar
 * repositorios HTTP quando o backend (Supabase/Node) estiver pronto.
 */
import type {
  IAccountRepository,
  IMemberRepository,
  ILootDropRepository,
  IHuntRepository,
  IBossRepository,
  ISplitRepository,
  IServiceiroRepository,
  IDashboardRepository,
  ISettingsRepository,
} from './interfaces';

import { MockAccountRepository } from './mock/mock-account-repository';
import { MockMemberRepository } from './mock/mock-member-repository';
import { MockLootDropRepository } from './mock/mock-loot-drop-repository';
import { MockHuntRepository } from './mock/mock-hunt-repository';
import { MockBossRepository } from './mock/mock-boss-repository';
import { MockSplitRepository } from './mock/mock-split-repository';
import { MockServiceiroRepository } from './mock/mock-serviceiro-repository';
import { MockDashboardRepository } from './mock/mock-dashboard-repository';
import { MockSettingsRepository } from './mock/mock-settings-repository';

export interface RepositoryContainer {
  account: IAccountRepository;
  member: IMemberRepository;
  lootDrop: ILootDropRepository;
  hunt: IHuntRepository;
  boss: IBossRepository;
  split: ISplitRepository;
  serviceiro: IServiceiroRepository;
  dashboard: IDashboardRepository;
  settings: ISettingsRepository;
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

function createRepositories(): RepositoryContainer {
  if (USE_MOCK) {
    return {
      account: new MockAccountRepository(),
      member: new MockMemberRepository(),
      lootDrop: new MockLootDropRepository(),
      hunt: new MockHuntRepository(),
      boss: new MockBossRepository(),
      split: new MockSplitRepository(),
      serviceiro: new MockServiceiroRepository(),
      dashboard: new MockDashboardRepository(),
      settings: new MockSettingsRepository(),
    };
  }

  // TODO: instanciar repositorios HTTP quando API estiver disponivel
  // return {
  //   account: new HttpAccountRepository(apiClient),
  //   ...
  // };

  throw new Error('Repositorios HTTP ainda nao implementados. Use VITE_USE_MOCK=true');
}

export const repositories = createRepositories();
