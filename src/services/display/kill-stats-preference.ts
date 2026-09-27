const STORAGE_KEY = 'tibia-pts:kill-stats-display-v2';
const EVENT_NAME = 'tibia-pts:kill-stats-display-updated';
const MAX_CUSTOM_CREATURES = 2;

/** As 4 criaturas monitoradas desde 2026-09-16/27, antes de existir essa configuração —
 * ficam SEMPRE disponíveis como checkbox em Configurações (pedido do usuário, 2026-09-27:
 * "os 4 boss... eles sempre podem aparecer para todos"), todas marcadas por padrão pra quem
 * nunca mexeu na tela ainda ("por padrão deve vim os 4 boss caso não tenha nada no
 * localstore"). Além delas, o usuário escolhe até MAX_CUSTOM_CREATURES criaturas quaisquer. */
export const DEFAULT_CREATURE_NAMES = ['Plunder Patriarches', 'Phosphorus', 'Bakragore', "Goshnar's Megalomania"];

export interface KillStatsPreference {
  /** Liga/desliga o widget inteiro na topbar. */
  enabled: boolean;
  /** Subconjunto de DEFAULT_CREATURE_NAMES atualmente marcado (checkbox por criatura). */
  defaultCreatures: string[];
  /** Até MAX_CUSTOM_CREATURES nomes livres, digitados pelo usuário (não precisam estar em DEFAULT_CREATURE_NAMES). */
  customCreatures: string[];
}

const DEFAULT_PREFERENCE: KillStatsPreference = {
  enabled: true,
  defaultCreatures: [...DEFAULT_CREATURE_NAMES],
  customCreatures: [],
};

/** Lista final (sem duplicata, ordem: os 4 padrão primeiro, depois os personalizados) que
 * de fato aparece na topbar — usada tanto pelo CreatureKillCounter quanto, se precisar, por
 * telas futuras que queiram saber "o que está configurado pra mostrar" de uma vez só. */
export function effectiveCreatureNames(preference: KillStatsPreference): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of [...preference.defaultCreatures, ...preference.customCreatures]) {
    const trimmed = name.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

/** Lê a preferência salva neste navegador, ou o padrão (os 4 marcados, sem personalizada,
 * ligado) se nunca foi configurada ou o JSON salvo estiver corrompido/no formato antigo. */
export function readKillStatsPreference(): KillStatsPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCE;
    const parsed = JSON.parse(raw) as Partial<KillStatsPreference>;
    if (typeof parsed.enabled !== 'boolean' || !Array.isArray(parsed.defaultCreatures) || !Array.isArray(parsed.customCreatures)) {
      return DEFAULT_PREFERENCE;
    }
    return {
      enabled: parsed.enabled,
      defaultCreatures: parsed.defaultCreatures.filter((n) => DEFAULT_CREATURE_NAMES.includes(n)),
      customCreatures: parsed.customCreatures.filter((n): n is string => typeof n === 'string' && n.trim() !== '').slice(0, MAX_CUSTOM_CREATURES),
    };
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

/** Grava a preferência (mesmo padrão de account-cache.ts: localStorage + CustomEvent, pra
 * CreatureKillCounter na topbar atualizar na hora ao salvar em Configurações, sem reload —
 * o evento nativo `storage` só dispara em OUTRAS abas). */
export function writeKillStatsPreference(preference: KillStatsPreference): void {
  const toSave: KillStatsPreference = {
    enabled: preference.enabled,
    defaultCreatures: preference.defaultCreatures.filter((n) => DEFAULT_CREATURE_NAMES.includes(n)),
    customCreatures: preference.customCreatures.map((n) => n.trim()).filter(Boolean).slice(0, MAX_CUSTOM_CREATURES),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // localStorage indisponível (aba anônima, quota cheia etc.) — segue sem persistir
  }
  window.dispatchEvent(new CustomEvent<KillStatsPreference>(EVENT_NAME, { detail: toSave }));
}

/** Chamar dentro de um useEffect; retorna a função de cleanup. */
export function onKillStatsPreferenceUpdate(callback: (preference: KillStatsPreference) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<KillStatsPreference>).detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
