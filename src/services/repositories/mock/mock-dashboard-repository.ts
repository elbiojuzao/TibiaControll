import type { DashboardKpis, MemberXpStats } from '@/types';
import type { IDashboardRepository } from '../interfaces';
import { mockDashboardKpis } from '@/mocks/data/dashboard-kpis';
import { mockMemberXpStats } from '@/mocks/data/member-xp-stats';
import { fetchXpSheetCached } from '@/services/xp-sheet/xp-sheet-cache';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

const EMPTY_KPIS: DashboardKpis = {
  qtdBags: 0,
  kksBagsInd: 0,
};

/** "+197.664.728" / "-476.736.286" — igual ao formato que já existe no mock, mas sem o
 * bug do formatTibiaGold (que esconde o sinal de negativo com Math.abs). O sinal aqui
 * importa: DashboardPage colore a célula de vermelho quando a string começa com "-". */
function formatXpValue(value: number): string {
  const sign = value < 0 ? '-' : '+';
  return sign + Math.abs(value).toLocaleString('pt-BR');
}

export class MockDashboardRepository implements IDashboardRepository {
  async getKpis(accountId: string): Promise<DashboardKpis> {
    await delay();
    return mockDashboardKpis[accountId] ?? EMPTY_KPIS;
  }

  /**
   * xpOntem/xp30Dias vêm de verdade da planilha do usuário (rotina automática dele, a
   * gente só lê o resultado via /api/xp-sheet — ver api/_lib/xp-sheet.ts). previsaoFimAno
   * e metas continuam mock por enquanto (decisão confirmada com o usuário em 2026-08-07;
   * reimplementar a projeção de nível é escopo futuro). Se a planilha falhar por
   * qualquer motivo (rede, mudou de lugar, etc.), cai pro valor mock sem quebrar a tela.
   */
  async getMemberXpStats(accountId: string): Promise<Record<string, MemberXpStats>> {
    await delay();
    const base = mockMemberXpStats[accountId] ?? {};

    try {
      const sheetStats = await fetchXpSheetCached();

      const merged: Record<string, MemberXpStats> = { ...base };
      for (const [characterName, stats] of Object.entries(sheetStats)) {
        merged[characterName] = {
          ...(merged[characterName] ?? { previsaoFimAno: '—', metas: {} }),
          xpOntem: formatXpValue(stats.xpOntem),
          xp30Dias: formatXpValue(stats.xp30Dias),
        };
      }
      return merged;
    } catch {
      // Planilha indisponível — mantém o dashboard funcionando com o mock.
      return base;
    }
  }
}
