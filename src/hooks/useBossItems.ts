import { useEffect, useState } from 'react';
import { fetchBossItems } from '@/services/supabase/boss-items-client';

/** Loot table por boss (tabela real boss_items, ver services/supabase/boss-items-client.ts)
 * — usada pro dropdown de Item em cascata no DropFormModal. Dado universal do jogo, igual
 * pra qualquer conta — busca 1x. */
export function useBossItems() {
  const [itemsByBoss, setItemsByBoss] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBossItems()
      .then((data) => {
        if (!cancelled) setItemsByBoss(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar itens');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { itemsByBoss, loading, error };
}
