import { diasRestantesNoAno } from './level-prediction';

/** Quantos "estágios" de 50 níveis mostrar abaixo do menor nível da party e acima do
 * maior — pedido do usuário em 2026-08-14. */
const ESTAGIOS_ABAIXO_DO_MENOR = 2;
const ESTAGIOS_ACIMA_DO_MAIOR = 4;
const PASSO_NIVEL = 50;
const NIVEL_MINIMO_TABELA = 50;
const NIVEL_MAXIMO_TABELA = 4000;

/** Marco de 50 em 50 mais próximo, arredondando pra baixo (ex: 1852 -> 1850). */
function nivelBase(level: number): number {
  return Math.floor(level / PASSO_NIVEL) * PASSO_NIVEL;
}

/**
 * Marcos de nível (múltiplos de 50) a exibir na Meta XP Diária, calculados a partir dos
 * níveis atuais (ao vivo) de cada membro da party: do menor nível − 2 estágios até o maior
 * nível + 4 estágios, limitado ao range coberto pela tabela xp_levels (50 a 4000).
 */
export function computeMetaLevelRange(currentLevels: number[]): number[] {
  const validLevels = currentLevels.filter((lvl) => lvl > 0);
  if (validLevels.length === 0) return [];

  const menor = nivelBase(Math.min(...validLevels));
  const maior = nivelBase(Math.max(...validLevels));

  const start = Math.max(NIVEL_MINIMO_TABELA, menor - ESTAGIOS_ABAIXO_DO_MENOR * PASSO_NIVEL);
  const end = Math.min(NIVEL_MAXIMO_TABELA, maior + ESTAGIOS_ACIMA_DO_MAIOR * PASSO_NIVEL);

  const levels: number[] = [];
  for (let lvl = start; lvl <= end; lvl += PASSO_NIVEL) levels.push(lvl);
  return levels;
}

/**
 * XP necessária por dia (até 31/12) pra um personagem alcançar cada nível-alvo, a partir
 * do seu nível/XP atuais e da tabela de referência xp_levels (level -> xp_total, via
 * useXpLevels). 'Lvl Atingido' se a XP atual já bate ou passa o marco.
 */
export function computeDailyGoals(
  currentXp: number,
  targetLevels: number[],
  xpByLevel: Record<number, number>,
  referenceDate: Date = new Date(),
): Record<number, string> {
  const diasRestantes = diasRestantesNoAno(referenceDate);
  const result: Record<number, string> = {};

  for (const lvl of targetLevels) {
    const xpNecessaria = xpByLevel[lvl];
    if (xpNecessaria === undefined) continue;

    if (currentXp >= xpNecessaria) {
      result[lvl] = 'Lvl Atingido';
      continue;
    }

    const faltam = xpNecessaria - currentXp;
    const metaDiaria = diasRestantes > 0 ? Math.ceil(faltam / diasRestantes) : faltam;
    result[lvl] = '+' + metaDiaria.toLocaleString('pt-BR');
  }

  return result;
}
