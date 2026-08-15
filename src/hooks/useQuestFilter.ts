import { useCallback, useState } from 'react';

const STORAGE_KEY = 'tibia-pts:boss-quest-filter-v1';

function readUncheckedQuests(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeUncheckedQuests(quests: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(quests)));
  } catch {
    // localStorage indisponível — segue sem persistir.
  }
}

/**
 * Filtro de quest (checkboxes) pro dropdown de Boss no formulário de drop — persistido em
 * localStorage, pedido do usuário em 2026-08-14. Guarda o conjunto de quests DESMARCADAS
 * (não as marcadas) de propósito: assim, por padrão (localStorage vazio) TODAS as quests
 * aparecem marcadas — e se uma quest nova for adicionada à tabela boss_quests no futuro,
 * ela também nasce marcada/visível, em vez de escondida até alguém lembrar de marcá-la.
 */
export function useQuestFilter() {
  const [uncheckedQuests, setUncheckedQuests] = useState<Set<string>>(readUncheckedQuests);

  const isQuestChecked = useCallback((quest: string) => !uncheckedQuests.has(quest), [uncheckedQuests]);

  const toggleQuest = useCallback((quest: string) => {
    setUncheckedQuests((prev) => {
      const next = new Set(prev);
      if (next.has(quest)) next.delete(quest);
      else next.add(quest);
      writeUncheckedQuests(next);
      return next;
    });
  }, []);

  return { isQuestChecked, toggleQuest };
}
