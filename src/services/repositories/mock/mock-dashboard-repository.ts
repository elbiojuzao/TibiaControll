import type { MemberXpStats } from '@/types';
import type { IDashboardRepository, IMemberXpSnapshotRepository } from '../interfaces';
import { mockMemberXpStats } from '@/mocks/data/member-xp-stats';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

/** "+197.664.728" / "-476.736.286" — igual ao formato que já existe no mock, mas sem o
 * bug do formatTibiaGold (que esconde o sinal de negativo com Math.abs). O sinal aqui
 * importa: DashboardPage colore a célula de vermelho quando a string começa com "-". */
function formatXpValue(value: number): string {
  const sign = value < 0 ? '-' : '+';
  return sign + Math.abs(value).toLocaleString('pt-BR');
}

export class MockDashboardRepository implements IDashboardRepository {
  private readonly xpSnapshots: IMemberXpSnapshotRepository;

  constructor(xpSnapshots: IMemberXpSnapshotRepository) {
    this.xpSnapshots = xpSnapshots;
  }

  /**
   * xpOntem/xp30Dias vêm do histórico real em member_xp_snapshots (preenchido todo dia pelo
   * cron api/cron/xp-collect; em modo mock o repositório devolve vazio). Meta XP Diária
   * (antes "metas" aqui, mock) foi removida deste tipo em 2026-08-14 — agora é computada à
   * parte em DashboardPage.tsx via services/xp/meta-xp-diaria.ts (tabela real
   * xp_levels + XP ao vivo do TibiaData), não passa mais por este repositório.
   * Se a leitura falhar por qualquer motivo, cai pro valor mock sem quebrar a tela.
   */
  async getMemberXpStats(accountId: string): Promise<Record<string, MemberXpStats>> {
    await delay();
    const base = mockMemberXpStats[accountId] ?? {};

    try {
      const xpStats = await this.xpSnapshots.getSeries(accountId);

      const merged: Record<string, MemberXpStats> = { ...base };
      for (const [characterName, stats] of Object.entries(xpStats)) {
        merged[characterName] = {
          ...merged[characterName],
          xpOntem: formatXpValue(stats.xpOntem),
          xp30Dias: formatXpValue(stats.xp30Dias),
        };
      }
      return merged;
    } catch {
      // Histórico de XP indisponível — mantém o dashboard funcionando com o mock.
      return base;
    }
  }
}
