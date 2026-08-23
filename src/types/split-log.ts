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
  /** Dano/cura da sessão (linhas "Damage:"/"Healing:" do log) — capturados desde
   * 2026-08-21, usados no Histórico de Splits (ranking/ordenação por player). Splits
   * salvos antes dessa data não têm esses campos no JSONB — tratar como 0 ao ler. */
  damage: number;
  healing: number;
}

export interface SplitLogTransfer {
  from: string;
  to: string;
  amount: number;
  commandText: string;
}

export type SplitLogType = 'hunt' | 'boss';

/** Dano/cura de 1 jogador num split, espelhando as colunas rígidas player1_nome/_dano/_cura
 * ... player8_* de split_logs (migration 20260822000000, pedido do usuário: "colocar até 8
 * colunas de player... teremos a coluna com o split inteiro e tambem teremos as colunas
 * rigidas de cada player"). Redundante DE PROPÓSITO com members[].damage/.healing — mesma
 * informação, guardada em formato rígido (colunas) além do jsonb, pro Histórico de Splits
 * ler direto sem "desmontar" o array toda vez. Populado por HttpSplitLogRepository a partir
 * de members[0..7] no momento de salvar. */
export interface SplitLogPlayerSlot {
  name: string;
  damage: number;
  healing: number;
}

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
  /** Até 8 entradas, na mesma ordem de `members` — [] pra splits salvos antes de
   * 2026-08-22 (colunas player1_*..player8_* ficam NULL nesses registros). */
  playerSlots: SplitLogPlayerSlot[];
  transfers: SplitLogTransfer[];
  totalBalance: number;
  equalShare: number;
  tcRate: number;
  /** Duração total da sessão em minutos (linha "Session: HH:MMh" do log), migration
   * 20260823000000 — pedido do usuário pra normalizar médias de dano/cura POR HORA no
   * Histórico de Splits (hunt de 3h não é comparável a hunt de 1h em dano bruto). `null` se
   * o log não tiver essa linha (nunca inventa uma duração) — nesse caso o split é excluído
   * do cálculo de média por hora, mas continua aparecendo normalmente na tabela. */
  durationMinutes: number | null;
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
  durationMinutes: number | null;
}
