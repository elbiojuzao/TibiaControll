/**
 * "Previsão fim de ano" (portada em 2026-08-10 de uma rotina antiga do usuário no Google
 * Apps Script; hoje roda direto no app) — dois insumos:
 * - XP atual: ao vivo da categoria "experience" dos Highscores do TibiaData (o Tibia não
 *   expõe XP total na página do personagem, só Level — mas os Highscores sim). Ver
 *   findExperienceValue em services/tibiadata/tibiadata-client.ts.
 * - Média diária de XP: XpCharacterStats.xp90Dias, soma dos últimos 90 dias do histórico
 *   em member_xp_snapshots (janela maior que os 30 do card "Xp 30Dias" — mais estável).
 */

/**
 * XP total necessária pra alcançar o nível L — fórmula oficial do Tibia (regra geral,
 * válida pra todas as vocações). Ex: xpParaNivel(2) = 100, xpParaNivel(3) = 200.
 */
export function xpParaNivel(level: number): number {
  return Math.floor((50 / 3) * (level ** 3 - 6 * level ** 2 + 17 * level - 12));
}

/** Dias restantes no ano corrente a partir de referenceDate (inclusive), até 31/12.
 * Compartilhado entre Previsão fim de ano e Meta XP Diária (services/xp/meta-xp-diaria.ts). */
export function diasRestantesNoAno(referenceDate: Date = new Date()): number {
  const fimAno = new Date(referenceDate.getFullYear(), 11, 31);
  const msPorDia = 86_400_000;
  return Math.max(0, Math.ceil((fimAno.getTime() - referenceDate.getTime()) / msPorDia));
}

/** Nível máximo pra evitar loop infinito num input absurdo — mesmo teto do script original. */
const NIVEL_MAXIMO_SANIDADE = 3500;

export interface PredictEndOfYearLevelInput {
  /** Nível atual (ao vivo, via TibiaData) */
  currentLevel: number;
  /** XP total acumulada atual (ao vivo, via Highscores "experience") */
  currentXp: number;
  /** Média de XP ganha por dia (ex: xp90Dias / 90) */
  avgDailyXp: number;
  /** Data de referência pro "hoje" — parametrizada só pra facilitar teste; default é agora. */
  referenceDate?: Date;
}

/**
 * Projeta o nível provável no fim do ano corrente, assumindo que a média diária de XP se
 * mantém constante até 31/12. Mesmo algoritmo do script original: soma XP atual + (média
 * diária × dias restantes até o fim do ano) e sobe de nível enquanto a XP prevista bater
 * o próximo patamar.
 */
export function predictEndOfYearLevel(input: PredictEndOfYearLevelInput): number {
  const { currentLevel, currentXp, avgDailyXp, referenceDate = new Date() } = input;
  if (!currentXp || !avgDailyXp) return currentLevel || 0;

  const diasRestantes = diasRestantesNoAno(referenceDate);
  const xpFinalPrevista = currentXp + avgDailyXp * diasRestantes;

  let nivelProvavel = Math.trunc(currentLevel) || 1;
  while (xpFinalPrevista >= xpParaNivel(nivelProvavel + 1)) {
    nivelProvavel++;
    if (nivelProvavel > NIVEL_MAXIMO_SANIDADE) break;
  }
  return nivelProvavel;
}
