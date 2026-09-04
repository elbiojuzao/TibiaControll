import { extractSplitSessionDate, extractSplitDurationMinutes } from './session-date';

/** Um jogador extraído do log, sem nenhum ajuste de UI (extraTc/extraGold são conceito da
 * página, não do parser) — SplitCalculatorPage.tsx mapeia isso pro PartyMember dela. */
export interface ParsedPartyMember {
  name: string;
  loot: number;
  supplies: number;
  balance: number;
  /** Dano/cura causados na sessão (linhas "Damage:"/"Healing:" do log) — não entram no
   * cálculo de split, só em "Damage Split"/Histórico de Splits. */
  damage: number;
  healing: number;
}

export interface ParsePartyHuntLogResult {
  members: ParsedPartyMember[];
  /** DD/MM/YYYY, já com a regra de corte de 1h aplicada — null se o log não tiver o
   * cabeçalho "Session data: From ...". */
  sessionDate: string | null;
  /** Duração total da sessão em minutos — null se o log não tiver "Session: HH:MMh". */
  durationMinutes: number | null;
}

export interface ParsePartyHuntLogError {
  error: string;
}

/**
 * Parser do log real do Party Hunt Analyzer do Tibia (formato "Session data: From ...",
 * blocos por jogador com Loot:/Supplies:/Balance:/Damage:/Healing:). Extraído de
 * `SplitCalculatorPage.tsx` em 2026-09-04 (função pura, sem nenhum state de React) pra
 * reusar também no formulário de "adicionar split rápido" do modal de dia do Calendário —
 * mesma lógica, dois lugares, sem duplicar. Comportamento IDÊNTICO ao que já existia,
 * inclusive os 2 bugs reais já corrigidos (caractere solto no início do log fazendo o
 * cabeçalho virar "jogador"; linhas Damage:/Healing: sem tab virando "jogador fantasma") —
 * ver histórico em `docs/architecture.json` (businessLogic.splitLoot) se precisar do
 * contexto completo desses fixes.
 */
export function parsePartyHuntLog(text: string): ParsePartyHuntLogResult | ParsePartyHuntLogError {
  // Segunda camada de proteção (a 1ª é o `onPaste` da página, que sempre SUBSTITUI o
  // campo inteiro em vez de inserir no meio): se a primeira linha não-vazia não for o
  // cabeçalho esperado, o parser trataria ela como nome de jogador e infla o Balance
  // total silenciosamente — melhor avisar e não calcular nada.
  const firstLine = text.split('\n').find((l) => l.trim())?.trim() ?? '';
  if (!/^Session data:/i.test(firstLine)) {
    return {
      error: `Log não reconhecido — a primeira linha deveria começar com "Session data:", mas veio "${firstLine.slice(0, 40)}${firstLine.length > 40 ? '...' : ''}". Confira se colou o texto completo do Party Hunt Analyzer, sem caracteres extras no início.`,
    };
  }

  const lines = text.split('\n');
  const parsedMembers: ParsedPartyMember[] = [];

  let currentName = '';
  let currentLoot = 0;
  let currentSupplies = 0;
  let currentBalance = 0;
  let currentDamage = 0;
  let currentHealing = 0;

  const cleanNumber = (str: string) => parseInt(str.replace(/[,.]/g, ''), 10) || 0;

  // Cabeçalho global (nunca é player, nem campo de player) e campos conhecidos de cada
  // player.
  const HEADER_PREFIXES = ['Session', 'Loot Type'];
  const FIELD_PREFIXES = ['Loot:', 'Supplies:', 'Balance:', 'Damage:', 'Healing:'];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (HEADER_PREFIXES.some((p) => trimmed.startsWith(p))) return;

    const isFieldLine = FIELD_PREFIXES.some((p) => trimmed.startsWith(p));

    // Detecta se a linha é o início de um bloco de player: qualquer linha que não seja
    // cabeçalho nem um campo conhecido. Detectar só pelo prefixo do campo (sem depender
    // de tab, já que o log real às vezes chega com indentação em espaços) evita o bug do
    // "jogador fantasma" — ver nota no docblock do módulo.
    if (!isFieldLine) {
      if (currentName) {
        parsedMembers.push({
          name: currentName,
          loot: currentLoot,
          supplies: currentSupplies,
          balance: currentBalance,
          damage: currentDamage,
          healing: currentHealing,
        });
      }
      // Limpa o nome removendo sufixos como (Leader) ou similar se houver
      currentName = trimmed.replace(/\s*\(Leader\).*$/i, '').trim();
      currentLoot = 0;
      currentSupplies = 0;
      currentBalance = 0;
      currentDamage = 0;
      currentHealing = 0;
    } else if (currentName) {
      if (trimmed.startsWith('Loot:')) {
        const match = trimmed.match(/[\d,.]+/);
        if (match) currentLoot = cleanNumber(match[0]);
      } else if (trimmed.startsWith('Supplies:')) {
        const match = trimmed.match(/[\d,.]+/);
        if (match) currentSupplies = cleanNumber(match[0]);
      } else if (trimmed.startsWith('Balance:')) {
        const match = trimmed.match(/[\d,.]+/);
        if (match) currentBalance = cleanNumber(match[0]);
      } else if (trimmed.startsWith('Damage:')) {
        const match = trimmed.match(/[\d,.]+/);
        if (match) currentDamage = cleanNumber(match[0]);
      } else if (trimmed.startsWith('Healing:')) {
        const match = trimmed.match(/[\d,.]+/);
        if (match) currentHealing = cleanNumber(match[0]);
      }
    }
  });

  // Insere o último player processado
  if (currentName) {
    parsedMembers.push({
      name: currentName,
      loot: currentLoot,
      supplies: currentSupplies,
      balance: currentBalance,
      damage: currentDamage,
      healing: currentHealing,
    });
  }

  return {
    members: parsedMembers,
    sessionDate: extractSplitSessionDate(text),
    durationMinutes: extractSplitDurationMinutes(text),
  };
}
