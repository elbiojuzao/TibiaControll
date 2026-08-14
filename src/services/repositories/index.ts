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
import { HttpServiceiroRepository } from './http/http-serviceiro-repository';
import { HttpLootDropRepository } from './http/http-loot-drop-repository';
import { HttpAccountRepository } from './http/http-account-repository';

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

/**
 * Flag independente do `USE_MOCK` geral — liga só o repositorio de
 * Serviceiros no Supabase real, enquanto o resto do app (sem implementacao
 * HTTP ainda) continua mock. Ver memoria de projeto "integracao-supabase".
 */
export const SERVICEIROS_USE_SUPABASE = import.meta.env.VITE_SERVICEIROS_USE_SUPABASE === 'true';

/** Mesma ideia da flag acima, mas para o repositorio de Loot Drops. */
export const LOOTDROPS_USE_SUPABASE = import.meta.env.VITE_LOOTDROPS_USE_SUPABASE === 'true';

/**
 * Mesma ideia, mas para o repositorio de Account — liga a resolucao da conta ao usuario
 * logado de verdade via Supabase Auth (RLS), em vez do mockAccount fixo. Ver useAuth /
 * useAccount / migration 20260814000000_enable_rls_with_auth.sql.
 */
export const ACCOUNT_USE_SUPABASE = import.meta.env.VITE_ACCOUNT_USE_SUPABASE === 'true';

function createRepositories(): RepositoryContainer {
  if (USE_MOCK) {
    return {
      account: ACCOUNT_USE_SUPABASE ? new HttpAccountRepository() : new MockAccountRepository(),
      member: new MockMemberRepository(),
      lootDrop: LOOTDROPS_USE_SUPABASE ? new HttpLootDropRepository() : new MockLootDropRepository(),
      hunt: new MockHuntRepository(),
      boss: new MockBossRepository(),
      split: new MockSplitRepository(),
      serviceiro: SERVICEIROS_USE_SUPABASE ? new HttpServiceiroRepository() : new MockServiceiroRepository(),
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
