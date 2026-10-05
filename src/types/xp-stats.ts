/** Histórico de XP por personagem, lido da tabela member_xp_snapshots (preenchida todo dia pelo cron api/cron/xp-collect) */
export interface XpDailyEntry {
  /** DD/MM/YYYY */
  date: string;
  value: number;
}

export interface XpCharacterStats {
  xpOntem: number;
  xp30Dias: number;
  /** Média usada pra Previsão fim de ano (janela maior = mais estável) — ver services/xp/level-prediction.ts */
  xp90Dias: number;
  series: XpDailyEntry[];
}
