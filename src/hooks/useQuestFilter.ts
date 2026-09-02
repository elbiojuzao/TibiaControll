import { useCallback, useState } from 'react';

const DEFAULT_STORAGE_KEY = 'tibia-pts:boss-quest-filter-v1';

function readUncheckedQuests(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeUncheckedQuests(storageKey: string, quests: Set<string>): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(quests)));
  } catch {
    // localStorage indisponível — segue sem persistir.
  }
}

/**
 * Filtro de quest (checkboxes), persistido em localStorage — pedido original em 2026-08-14
 * pro dropdown de Boss no formulário de drop. Guarda o conjunto de quests DESMARCADAS (não
 * as marcadas) de propósito: assim, por padrão (localStorage vazio) TODAS as quests aparecem
 * marcadas — e se uma quest nova for adicionada à tabela boss_quests no futuro, ela também
 * nasce marcada/visível, em vez de escondida até alguém lembrar de marcá-la.
 *
 * `storageKey` opcional (2026-09-02, pedido do usuário: filtro de quest pra mensagem de
 * itens não vendidos — "geralmente não anunciamos os itens dos plunders") — cada tela que usa
 * o filtro guarda sua PRÓPRIA seleção (ex: filtrar bosses no form de drop é uma decisão
 * diferente de filtrar quest na mensagem de venda), em vez de compartilhar 1 preferência
 * global. Default mantém a chave original, sem quebrar o uso já existente no DropFormModal.
 */
export function useQuestFilter(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [uncheckedQuests, setUncheckedQuests] = useState<Set<string>>(() => readUncheckedQuests(storageKey));

  const isQuestChecked = useCallback((quest: string) => !uncheckedQuests.has(quest), [uncheckedQuests]);

  const toggleQuest = useCallback((quest: string) => {
    setUncheckedQuests((prev) => {
      const next = new Set(prev);
      if (next.has(quest)) next.delete(quest);
      else next.add(quest);
      writeUncheckedQuests(storageKey, next);
      return next;
    });
  }, [storageKey]);

  return { isQuestChecked, toggleQuest };
}
