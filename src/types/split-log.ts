/** Um jogador dentro de um split salvo — espelha PartyMember de
 * SplitCalculatorPage.tsx, já com o ajuste de gastos extras aplicado
 * (adjustedBalance = balance − (extraGold*1000 + extraTc*tcRate)). */
export interface SplitLogMember {
  name: string;
  loot: number;
  supplies: number;
  balance: number;
  extraTc: number;
  extraGold: number;
  adjustedBalance: number;
}

export interface SplitLogTransfer {
  from: string;
  to: string;
  amount: number;
  commandText: string;
}

export type SplitLogType = 'hunt' | 'boss';

/** Split calculado na Calculadora de Split Loot e salvo no banco (2026-08-19, pedido do
 * usuário: consolidar o que hoje fica numa planilha à parte). Guarda o log bruto colado
 * (não só os valores já calculados) de propósito — o usuário quer poder reprocessar/
 * ajustar depois caso um dia não seja salvo ou dê algum problema. */
export interface SplitLog {
  id: string;
  accountId: string;
  /** DD/MM/YYYY — data da SESSÃO (extraída do log, não da data em que foi salvo), já
   * aplicando a regra de corte: sessão que termina entre 00:00 e 00:59 conta pro dia
   * anterior. */
  date: string;
  type: SplitLogType;
  rawLog: string;
  members: SplitLogMember[];
  transfers: SplitLogTransfer[];
  totalBalance: number;
  equalShare: number;
  tcRate: number;
  createdAt: string;
}

export interface CreateSplitLogDto {
  date: string;
  type: SplitLogType;
  rawLog: string;
  members: SplitLogMember[];
  transfers: SplitLogTransfer[];
  totalBalance: number;
  equalShare: number;
  tcRate: number;
}
