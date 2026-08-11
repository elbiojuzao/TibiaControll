/** Histórico de XP lido ao vivo da planilha do usuário — ver memória "integracao-planilha-xp" */
export interface XpDailyEntry {
  /** DD/MM/YYYY */
  date: string;
  value: number;
}

export interface XpCharacterStats {
  xpOntem: number;
  xp30Dias: number;
  /** Média usada pra Previsão fim de ano (janela maior = mais estável) — ver services/xp-sheet/level-prediction.ts */
  xp90Dias: number;
  series: XpDailyEntry[];
}
