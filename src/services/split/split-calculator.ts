import type {
  SplitCalculationInput,
  SplitCalculationResult,
  SplitPlayer,
  TransferInstruction,
} from '@/types';

/**
 * Algoritmo de split loot conforme especificacao tecnica:
 * 1. Somar balances individuais
 * 2. Dividir pelo numero de jogadores ativos = Cota Justa
 * 3. Classificar credores e devedores
 * 4. Matchmaking para minimizar transferencias
 */
export function calculateSplit(input: SplitCalculationInput): SplitCalculationResult {
  const activePlayers = input.players.filter((p) => !p.excluded);
  const playerCount = activePlayers.length;

  if (playerCount === 0) {
    return emptyResult();
  }

  const extraTotal = (input.extraExpenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  const globalBalance = activePlayers.reduce((sum, p) => sum + p.balance, 0) - extraTotal;
  const fairShare = globalBalance / playerCount;

  const playerBalances = activePlayers.map((p) => {
    const delta = p.balance - fairShare;
    let role: 'creditor' | 'debtor' | 'settled';
    if (Math.abs(delta) < 1) role = 'settled';
    else if (delta < 0) role = 'creditor';
    else role = 'debtor';

    return {
      name: p.name,
      inGameBalance: p.balance,
      fairShare,
      delta,
      role,
    };
  });

  const transfers = matchmakeTransfers(activePlayers, fairShare, extraTotal);

  return {
    fairShare,
    globalBalance,
    activePlayerCount: playerCount,
    transfers,
    playerBalances,
  };
}

function matchmakeTransfers(
  players: SplitPlayer[],
  fairShare: number,
  extraTotal: number,
): TransferInstruction[] {
  const adjustedBalances = players.map((p) => ({
    name: p.name,
    delta: p.balance - fairShare,
  }));

  const creditors = adjustedBalances
    .filter((p) => p.delta < -1)
    .map((p) => ({ name: p.name, amount: Math.abs(p.delta) }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = adjustedBalances
    .filter((p) => p.delta > 1)
    .map((p) => ({ name: p.name, amount: p.delta }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: TransferInstruction[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].amount, debtors[di].amount);
    if (amount >= 1) {
      transfers.push({
        from: debtors[di].name,
        to: creditors[ci].name,
        amount: Math.round(amount),
        tibiaCommand: `transfer ${Math.round(amount)} to ${creditors[ci].name}`,
      });
    }
    creditors[ci].amount -= amount;
    debtors[di].amount -= amount;
    if (creditors[ci].amount < 1) ci++;
    if (debtors[di].amount < 1) di++;
  }

  void extraTotal;
  return transfers;
}

function emptyResult(): SplitCalculationResult {
  return {
    fairShare: 0,
    globalBalance: 0,
    activePlayerCount: 0,
    transfers: [],
    playerBalances: [],
  };
}

/** Formata valor em gold do Tibia (ex: 989.759.000) */
export function formatTibiaGold(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return prefix + Math.abs(value).toLocaleString('pt-BR');
}

/** Converte string do log Tibia para numero */
export function parseTibiaGold(value: string): number {
  return Number(value.replace(/[^\d-]/g, '')) || 0;
}
