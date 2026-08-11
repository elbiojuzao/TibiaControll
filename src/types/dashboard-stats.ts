/** Histórico diário de XP por personagem — a API pública do Tibia não expõe isso (ver [[integracao-tibiadata]]).
 * previsaoFimAno NÃO está aqui — é computada em DashboardPage.tsx via
 * services/xp-sheet/level-prediction.ts (level ao vivo do TibiaData + xp90Dias da planilha),
 * não vem mais de mock (ver [[integracao-planilha-xp]]). */
export interface MemberXpStats {
  xpOntem: string;
  xp30Dias: string;
  metas: Record<number, string>;
}
