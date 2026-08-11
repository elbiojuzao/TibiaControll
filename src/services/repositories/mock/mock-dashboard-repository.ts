import type { MemberXpStats } from '@/types';
import type { IDashboardRepository } from '../interfaces';
import { mockMemberXpStats } from '@/mocks/data/member-xp-stats';
import { fetchXpSheetCached } from '@/services/xp-sheet/xp-sheet-cache';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

/** "+197.664.728" / "-476.736.286" — igual ao formato que já existe no mock, mas sem o
 * bug do formatTibiaGold (que esconde o sinal de negativo com Math.abs). O sinal aqui
 * importa: DashboardPage colore a célula de vermelho quando a string começa com "-". */
function formatXpValue(value: number): string {
  const sign = value < 0 ? '-' : '+';
  return sign + Math.abs(value).toLocaleString('pt-BR');
}

export class MockDashboardRepository implements IDashboardRepository {
  /**
   * xpOntem/xp30Dias vêm de verdade da planilha do usuário (rotina automática dele, a
   * gente só lê o resultado via /api/xp-sheet — ver api/_lib/xp-sheet.ts). metas continua
   * mock por enquanto (decisão confirmada com o usuário em 2026-08-07; reimplementar a
   * projeção por nível é escopo futuro — previsaoFimAno, a projeção de nível único, já foi
   * portada em 2026-08-10, ver DashboardPage.tsx + services/xp-sheet/level-prediction.ts).
   * Se a planilha falhar por qualquer motivo (rede, mudou de lugar, etc.), cai pro valor
   * mock sem quebrar a tela.
   */
  async getMemberXpStats(accountId: string): Promise<Record<string, MemberXpStats>> {
    await delay();
    const base = mockMemberXpStats[accountId] ?? {};

    try {
      const sheetStats = await fetchXpSheetCached();

      const merged: Record<string, MemberXpStats> = { ...base };
      for (const [characterName, stats] of Object.entries(sheetStats)) {
        merged[characterName] = {
          ...(merged[characterName] ?? { metas: {} }),
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
