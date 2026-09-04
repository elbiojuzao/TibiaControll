/** Rascunhos de split PROCESSADOS mas NÃO SALVOS no banco (2026-09-04, pedido do usuário:
 * "seria bom tambem ter o split que o usuario fez e não salvou... ficar salvo em localstore
 * ou cache dos ultimos 5") — se o usuário colar um log, calcular o split, e sair da página
 * (ou esquecer de clicar "Salvar") antes de salvar de verdade, o log bruto fica guardado
 * aqui e reaparece como "Rascunhos não salvos" na Calculadora de Split Loot, com um clique
 * pra recarregar e continuar de onde parou. Puramente local (não é dado de conta — mesmo
 * padrão client-side de `tibia-pts:tc-rate`), guarda só o log bruto + um resumo pra exibir
 * sem precisar reprocessar toda vez (dedupe pelo texto exato do log). */

const STORAGE_KEY = 'tibia-pts:unsaved-split-drafts-v1';
const MAX_DRAFTS = 5;

export interface UnsavedSplitDraft {
  rawLog: string;
  /** DD/MM/YYYY extraído do log, ou null se o log não tinha o cabeçalho esperado. */
  sessionDate: string | null;
  totalBalance: number;
  equalShare: number;
  /** ISO — quando esse rascunho foi processado/atualizado, pra ordenar mais recente primeiro. */
  savedAt: string;
}

function readAll(): UnsavedSplitDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(drafts: UnsavedSplitDraft[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // localStorage indisponível (aba anônima, quota cheia etc.) — segue sem persistir
  }
}

export function readUnsavedSplitDrafts(): UnsavedSplitDraft[] {
  return readAll();
}

/** Adiciona/atualiza um rascunho (dedupe pelo texto EXATO do log — reprocessar o mesmo log
 * só atualiza `savedAt` e reordena pro topo, não duplica). Mantém só os `MAX_DRAFTS` mais
 * recentes. */
export function addUnsavedSplitDraft(draft: Omit<UnsavedSplitDraft, 'savedAt'>): void {
  const existing = readAll().filter((d) => d.rawLog !== draft.rawLog);
  const next = [{ ...draft, savedAt: new Date().toISOString() }, ...existing].slice(0, MAX_DRAFTS);
  writeAll(next);
}

/** Remove um rascunho — chamado depois que o split correspondente é salvo de verdade no
 * banco (não precisa mais da rede de segurança local). */
export function removeUnsavedSplitDraft(rawLog: string): void {
  writeAll(readAll().filter((d) => d.rawLog !== rawLog));
}
