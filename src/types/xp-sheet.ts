/** Histórico de XP lido ao vivo da planilha do usuário — ver memória "integracao-planilha-xp" */
export interface XpDailyEntry {
  /** DD/MM/YYYY */
  date: string;
  value: number;
}

export interface XpCharacterStats {
  xpOntem: number;
  xp30Dias: number;
  series: XpDailyEntry[];
}
