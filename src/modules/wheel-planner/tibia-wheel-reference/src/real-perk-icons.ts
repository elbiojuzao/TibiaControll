/**
 * Ícones reais pra Conviction Perks que ainda caem em emoji (2026-09-05, pedido do
 * usuário: "a roda do monk esta com os icones em vez das imagens das magias"). Não é
 * código do gitlab.com/klhio/tibia-wheel original.
 *
 * A maioria dos Conviction Perks já usa o sprite ANTIGO (2022) via `icon?: number` em
 * data.yaml, pros conceitos que continuam os mesmos hoje (ver OLD_ICON no gerador
 * `gen_yaml.py`) — isso já funciona e não muda aqui. Este arquivo cobre só o que sobrou
 * caindo em emoji: o Monk inteiro (não existia em 2022, sem sprite antigo pra reusar) e
 * os feitiços que TROCARAM de nome desde então (Shield Slam substituiu Chivalrous
 * Challenge, Divine Barrage/Ethereal Barrage substituíram Swift Foot/Sharpshooter,
 * Special Spells substituiu Sap Strength, Death Echo e Forked Spells são "5º feitiço"
 * novo por vocação).
 *
 * Arquivos em `src/assets/wheel-icons/` (raiz do projeto, não deste módulo) — baixados
 * por `scripts/fetch-wheel-icons.mjs` de tibiawiki.com.br / tibia.fandom.com (mesmo
 * pipeline reutilizável de `[[icones-reais-itens]]`). "Augmented Thousand Fist Blows"
 * (Monk) não tem ícone publicado em nenhuma das duas wikis ainda — continua emoji.
 */
const iconModules = import.meta.glob<string>('/src/assets/wheel-icons/*.gif', {
  eager: true,
  import: 'default',
});

const REAL_ICON_IDS: Record<string, string> = {
  // Monk — não existia no sprite antigo de 2022
  'Guiding Presence': 'guiding_presence',
  'Sanctuary': 'sanctuary',
  'Augmented Mass Spirit Mend': 'mass_spirit_mend',
  'Augmented Flurry of Blows': 'flurry_of_blows',
  'Augmented Mystic Repulse': 'mystic_repulse',
  'Augmented Chained Penance': 'chained_penance',
  'Fist Fighting Skill Boost': 'skillboost',
  // Feitiços renomeados desde 2022 (sprite antigo tinha o nome/conceito velho)
  'Augmented Shield Slam': 'shield_slam',
  'Augmented Divine Barrage': 'divine_barrage',
  'Augmented Ethereal Barrage': 'ethereal_barrage',
  'Augmented Death Echo': 'death_echo',
  'Augmented Special Spells': 'special_spells',
  'Augmented Forked Spells': 'forked_spells',
};

export function realConvictionIconUrl(perkName: string): string | undefined {
  const id = REAL_ICON_IDS[perkName];
  return id ? iconModules[`/src/assets/wheel-icons/${id}.gif`] : undefined;
}

/** Lookup genérico por id de arquivo (sem extensão) — usado por gem-logic.ts pros ícones
 * de proteção elemental das gemas do Ateliê. */
export function wheelIconUrlById(id: string): string | undefined {
  return iconModules[`/src/assets/wheel-icons/${id}.gif`];
}
