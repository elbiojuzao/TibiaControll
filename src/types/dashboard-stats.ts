/** Histórico diário de XP por personagem — a API pública do Tibia não expõe isso (ver [[integracao-tibiadata]]) */
export interface MemberXpStats {
  xpOntem: string;
  xp30Dias: string;
  previsaoFimAno: string;
  metas: Record<number, string>;
}
