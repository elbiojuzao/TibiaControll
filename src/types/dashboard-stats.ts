/**
 * Indicadores agregados do Dashboard cuja regra de cálculo ainda não foi definida
 * (classificação de drop em Bag/Boss não existe no modelo de LootDrop hoje — Plunder já
 * saiu daqui, ver abaixo). Tratados como valores pré-agregados vindos do "banco" (mock
 * agora, backend depois), não computados no front — ver memória do projeto antes de
 * tentar derivar isso de outra fonte.
 * "KKs Plunder(ind)"/"Qtd Plunders" NÃO estão aqui — são computados na Dashboard a partir
 * dos LootDrops reais com bossName "Plunder" (soma/contagem do Valor Total no mês/ano
 * selecionado). "Total (ind)" também não está aqui — é
 * KKs Plunder(ind) + kksBagsInd + KKs Hunt + KKs Boss (Hunt/Boss vêm da planilha, ver
 * useBossHuntSheet).
 */
export interface DashboardKpis {
  qtdBags: number;
  kksBagsInd: number;
}

/** Histórico diário de XP por personagem — a API pública do Tibia não expõe isso (ver [[integracao-tibiadata]]) */
export interface MemberXpStats {
  xpOntem: string;
  xp30Dias: string;
  previsaoFimAno: string;
  metas: Record<number, string>;
}
