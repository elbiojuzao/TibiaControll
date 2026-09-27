import { useEffect, useState } from 'react';
import { fetchCreatureCatalogCached } from '@/services/tibiadata/creature-catalog-cache';
import type { CreatureCatalogEntry } from '@/services/tibiadata/tibiadata-client';

/** Catálogo completo de criaturas do TibiaData (nome + ícone oficial) — usado pra popular
 * o datalist de sugestões em Configurações e pra resolver o ícone de uma criatura
 * personalizada escolhida pelo usuário (ver CreatureKillCounter). `[]` enquanto carrega ou
 * se a busca falhar (o resto do app continua funcionando, só sem sugestão/ícone). */
export function useCreatureCatalog(): CreatureCatalogEntry[] {
  const [catalog, setCatalog] = useState<CreatureCatalogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCreatureCatalogCached()
      .then((data) => { if (!cancelled) setCatalog(data); })
      .catch(() => { if (!cancelled) setCatalog([]); });
    return () => { cancelled = true; };
  }, []);

  return catalog;
}
