export interface IndividualSplit {
  id: string;
  huntId: string;
  memberId: string;
  characterName: string;
  wasteSpent: number;
  balanceToReceive: number;
  serviceiroAmount: number;
}

export interface SplitPlayer {
  name: string;
  balance: number;
  waste: number;
  excluded?: boolean;
  isServiceiro?: boolean;
  serviceiroSharePercent?: number;
  ownerName?: string;
}

export interface SplitCalculationInput {
  players: SplitPlayer[];
  extraExpenses?: { amount: number; paidBy: string; description?: string }[];
}

export interface TransferInstruction {
  from: string;
  to: string;
  amount: number;
  /** String pronta para copiar no chat do Tibia */
  tibiaCommand: string;
}

export interface SplitCalculationResult {
  fairShare: number;
  globalBalance: number;
  activePlayerCount: number;
  transfers: TransferInstruction[];
  playerBalances: {
    name: string;
    inGameBalance: number;
    fairShare: number;
    delta: number;
    role: 'creditor' | 'debtor' | 'settled';
  }[];
}
