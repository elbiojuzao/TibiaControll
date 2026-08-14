/** Histórico diário de XP por personagem — a API pública do Tibia não expõe isso (ver [[integracao-tibiadata]]).
 * previsaoFimAno NÃO está aqui — é computada em DashboardPage.tsx via
 * services/xp-sheet/level-prediction.ts (level ao vivo do TibiaData + xp90Dias da planilha),
 * não vem mais de mock (ver [[integracao-planilha-xp]]). Meta XP Diária (marcos de 50 em 50
 * níveis) também não está aqui — computada em DashboardPage.tsx via
 * services/xp-sheet/meta-xp-diaria.ts (tabela real xp_levels + XP ao vivo), 2026-08-14. */
export interface MemberXpStats {
  xpOntem: string;
  xp30Dias: string;
}
