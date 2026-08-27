import { formatTibiaGold } from '@/services/split';
import type { Member, Serviceiro, TransferInstruction, Vocation } from '@/types';

/** Linha em edição do formulário — vira um DropService completo só quando serviceiro + vocação estão preenchidos */
export interface ServiceDraft {
  serviceiroId: string;
  vocation: Vocation | '';
  /** Nome do char (EK/ED/MS/RP/5º desse drop) que esse serviceiro serviu de fato */
  servedCharacterName: string;
}

/** Nomes do vocation p/ o select, sempre incluindo o valor atual mesmo se ele não estiver mais na lista de Members (ex: drop histórico de um char que já saiu da PT) */
export function vocationOptions(members: Member[], vocation: Vocation, current: string): string[] {
  const names = new Set(members.filter((m) => m.vocation === vocation).map((m) => m.characterName));
  if (current) names.add(current);
  return Array.from(names);
}

/** 5º Player é sempre um serviceiro (terceiro completando a vaga, não um Member fixo da
 * PT) — pedido do usuário em 2026-08-14. Lista o NOME do serviceiro (não o boneco/
 * characterName) — pedido do usuário em 2026-08-16: "o nome do boneco é usado apenas
 * para pagamentos... o nome do boneco nunca é usado para identificação". Sempre inclui
 * o valor atual mesmo que não bata com nenhum serviceiro hoje (drop histórico). */
export function fifthPlayerOptions(serviceiros: Serviceiro[], current: string): string[] {
  const names = new Set(serviceiros.map((s) => s.name).filter(Boolean));
  if (current) names.add(current);
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

/** O boneco (Serviceiro.characterName) só existe pra gerar comando `transfer` in-game
 * — em qualquer lugar de identificação (5º Player, Fragador, etc.) usa-se o nome real
 * do serviceiro. Como `party.fifthPlayer` agora guarda o nome real (não mais o boneco,
 * ver fifthPlayerOptions), resolve de volta pro boneco só na hora de montar o comando de
 * pagamento; slots de Member (EK/ED/MS/RP) não batem com nenhum serviceiro e passam
 * direto. */
export function resolvePaymentTarget(slotValue: string, serviceiros: Serviceiro[]): string {
  const serviceiro = serviceiros.find((s) => s.name === slotValue);
  return serviceiro?.characterName || slotValue;
}

export interface PlayerOption {
  value: string;
  label: string;
}

/** Opções de "jogador servido" — os chars preenchidos acima (EK/ED/MS/RP/5º) nesse
 * drop específico, sempre incluindo o valor atual mesmo que não bata mais com
 * nenhum campo (ex: composição editada depois do vínculo já ter sido salvo). */
export function servedPlayerOptions(party: { ek: string; ed: string; ms: string; rp: string; fifthPlayer: string }, current: string): PlayerOption[] {
  const opts: PlayerOption[] = [];
  const push = (slot: string, value: string) => {
    if (value) opts.push({ value, label: `${slot} — ${value}` });
  };
  push('EK', party.ek);
  push('ED', party.ed);
  push('MS', party.ms);
  push('RP', party.rp);
  push('5º', party.fifthPlayer);
  if (current && !opts.some((o) => o.value === current)) opts.push({ value: current, label: current });
  return opts;
}

/** A vocação some do form (o usuário já escolhe direto quem foi servido), mas continua
 * guardada — dá pra inferir automaticamente porque cada slot (EK/ED/MS/RP) já é a
 * vocação. Não dá pra inferir pro 5º Player, então fica sem vocação nesse caso. */
export function deriveVocation(party: { ek: string; ed: string; ms: string; rp: string }, servedCharacterName: string): Vocation | '' {
  if (!servedCharacterName) return '';
  if (servedCharacterName === party.ek) return 'EK';
  if (servedCharacterName === party.ed) return 'ED';
  if (servedCharacterName === party.ms) return 'MS';
  if (servedCharacterName === party.rp) return 'RP';
  return '';
}

/** Uma cota devida a alguém sem "Boneco" (characterName) cadastrado em Serviceiros —
 * não dá pra gerar `transfer X to Y` sem saber o nome do char, mas o valor ainda é
 * devido, então mostra como um card à parte (nome da pessoa, não do char) com aviso,
 * em vez de sumir com a cota silenciosamente (pedido do usuário: "aparecer aparte...
 * com alerta de que não possui boneco assim o usuario lembra de buscar pagar ele"). */
export interface MissingCharacterShare {
  serviceiroName: string;
  amount: number;
}

/** Quebra o Valor Cada em comandos "transfer X to Y" por pessoa — mesmo formato de
 * "Copiar Comandos de Transferência" do Split Loot Calculator. Vaga sem serviceiro: o
 * dono da vaga recebe a cota cheia. Vaga com serviceiro: o serviceiro (Serviceiro
 * contato, não Member — ver [[modulo-dashboard-historico]]) fica com 50% da cota, o
 * dono da vaga com os outros 50% (regra de negócio confirmada pelo usuário; fixo em
 * 50%, diferente do `serviceiroSharePercent` configurável de Member/Split Loot, que é
 * um conceito separado). `payer` é quem já está com o dinheiro em mãos depois de vender
 * o item — o Vendedor Padrão configurado em Configurações (`Member.isDefaultSeller`),
 * NÃO o Fragador (quem looted o item pode ser qualquer um, quem vende é sempre o mesmo
 * membro fixo da party — corrigido em 2026-08-16, bug real reportado pelo usuário: "hoje
 * esta marcando o koe psiko mas na minha party quem vende é o thanatos"). `payer` nunca
 * recebe um comando pra si mesmo. */
export function computeTransferInstructions(
  party: { ek: string; ed: string; ms: string; rp: string; fifthPlayer: string },
  services: ServiceDraft[],
  serviceiros: Serviceiro[],
  unitValue: number,
  payer: string,
): { instructions: TransferInstruction[]; missingCharacterShares: MissingCharacterShare[] } {
  if (!payer || unitValue <= 0) return { instructions: [], missingCharacterShares: [] };

  const slots = [party.ek, party.ed, party.ms, party.rp, party.fifthPlayer].filter(Boolean);
  const instructions: TransferInstruction[] = [];
  const missingCharacterShares: MissingCharacterShare[] = [];
  const push = (to: string, amount: number) => {
    if (!to || to === payer || amount <= 0) return;
    instructions.push({ from: payer, to, amount, tibiaCommand: `transfer ${amount} to ${to}` });
  };

  for (const slotName of slots) {
    const paymentTarget = resolvePaymentTarget(slotName, serviceiros);
    const servants = services.filter((s) => s.serviceiroId && s.servedCharacterName === slotName);
    if (servants.length === 0) {
      push(paymentTarget, unitValue);
      continue;
    }
    const servantPool = Math.round(unitValue * 0.5);
    const perServant = Math.round(servantPool / servants.length);
    push(paymentTarget, unitValue - servantPool);
    for (const servant of servants) {
      const serviceiro = serviceiros.find((s) => s.id === servant.serviceiroId);
      if (!serviceiro || perServant <= 0) continue;
      if (serviceiro.characterName) {
        push(serviceiro.characterName, perServant);
      } else {
        missingCharacterShares.push({ serviceiroName: serviceiro.name, amount: perServant });
      }
    }
  }

  return { instructions, missingCharacterShares };
}

export interface ShareEntry {
  name: string;
  amount: number;
}

/** Mesma quebra de cota 50/50 de computeTransferInstructions, mas pra montar a
 * mensagem de aviso de venda (2026-08-16, pedido do usuário) — SEM excluir quem paga
 * (ele também tem uma cota, só não recebe comando `transfer` pra si mesmo) e sempre com
 * o nome real (nunca o boneco, que só serve pro comando de transferência em si). */
export function computeShareBreakdown(
  party: { ek: string; ed: string; ms: string; rp: string; fifthPlayer: string },
  services: ServiceDraft[],
  serviceiros: Serviceiro[],
  unitValue: number,
): { playerShares: ShareEntry[]; serviceiroShares: ShareEntry[] } {
  const slots = [party.ek, party.ed, party.ms, party.rp, party.fifthPlayer].filter(Boolean);
  const playerShares: ShareEntry[] = [];
  const serviceiroShares: ShareEntry[] = [];

  for (const slotName of slots) {
    const servants = services.filter((s) => s.serviceiroId && s.servedCharacterName === slotName);
    if (servants.length === 0) {
      if (unitValue > 0) playerShares.push({ name: slotName, amount: unitValue });
      continue;
    }
    const servantPool = Math.round(unitValue * 0.5);
    const perServant = Math.round(servantPool / servants.length);
    const ownerShare = unitValue - servantPool;
    if (ownerShare > 0) playerShares.push({ name: slotName, amount: ownerShare });
    for (const servant of servants) {
      const serviceiro = serviceiros.find((s) => s.id === servant.serviceiroId);
      if (serviceiro && perServant > 0) serviceiroShares.push({ name: serviceiro.name, amount: perServant });
    }
  }

  return { playerShares, serviceiroShares };
}

/** Mensagem pronta pra avisar a party da venda no WhatsApp — formato exato pedido pelo
 * usuário em 2026-08-16 (item/boss em negrito, valor da venda, lista de cada um com sua
 * parte, total no fim). */
export function buildSaleMessage(itemName: string, bossName: string, totalValue: number, playerShares: ShareEntry[], serviceiroShares: ShareEntry[]): string {
  const lines = [
    `*${itemName} — ${bossName}*`,
    `💰 Venda: *${formatTibiaGold(totalValue)}*`,
    '',
    '',
    ...playerShares.map((p) => `* ${p.name} — ${formatTibiaGold(p.amount)}`),
    ...serviceiroShares.map((s) => `* ${s.name} — ${formatTibiaGold(s.amount)}`),
    '',
    `*Total: ${formatTibiaGold(totalValue)}*`,
  ];
  return lines.join('\n');
}
