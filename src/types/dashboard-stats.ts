/**
 * Indicadores agregados do Dashboard cuja regra de cálculo ainda não foi definida
 * (classificação de drop em Plunder/Bag/Boss não existe no modelo de LootDrop hoje).
 * Tratados como valores pré-agregados vindos do "banco" (mock agora, backend depois),
 * não computados no front — ver memória do projeto antes de tentar derivar isso de outra fonte.
 * "Total (ind)" NÃO está aqui — é computado na Dashboard como
 * kksPlunderInd + kksBagsInd + KKs Hunt + KKs Boss (esses dois últimos vêm da planilha,
 * ver useBossHuntSheet).
 */
export interface DashboardKpis {
  kksPlunderInd: number;
  qtdBags: number;
  qtdPlunders: number;
  kksBagsInd: number;
}

/** Histórico diário de XP por personagem — a API pública do Tibia não expõe isso (ver [[integracao-tibiadata]]) */
export interface MemberXpStats {
  xpOntem: string;
  xp30Dias: string;
  previsaoFimAno: string;
  metas: Record<number, string>;
}
