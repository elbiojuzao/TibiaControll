/**
 * Ateliê de Gemas / Vessel gems (2026-09-05, pedido do usuário: "esse slot não tem no
 * nosso sistema... possibilita colocar uma gema que pode ser lesser regular ou greater").
 * Não é código do gitlab.com/klhio/tibia-wheel original — feature nova.
 *
 * Dados extraídos ao vivo do endpoint público de tibiapal.com
 * (`/data/wheel-planner/SkillwheelStringsJsonLibrary.json`, mesmo endpoint já usado pra
 * `data.yaml`) — ver `gem-data.json`, gerado por
 * `scratch-tibia-wheel/gem-atelier/gen_gem_data.py`.
 *
 * MODELO CORRETO (2026-09-05, correção GRAVE do usuário — as 2 tentativas anteriores
 * (1 gema por domínio inteiro; depois 1 gema por FATIA) estavam erradas): existe **1 gema
 * por DOMÍNIO** (não por fatia), e os bônus dela se DISTRIBUEM pelas 3 fatias de Vessel
 * Resonance daquele domínio, em ordem crescente de anel — 1 bônus por fatia
 * ("apenas 1 por fatia", "cada vessel é um slot de bônus"):
 * - Gema Lesser (1 mod básico)  -> só a fatia de anel mais baixo (ex.: D1) recebe bônus.
 * - Gema Regular (2 básicos)    -> a de anel mais baixo (D1) + a do meio (D3).
 * - Gema Greater (2 básicos + 1 supremo) -> as 3 (D1, D3, D4a — o supremo sempre na
 *   última/anel mais alto).
 * Confirmado pelo usuário com um exemplo concreto: Fire Resistance -> D1, Earth+Ice
 * Resistance -> D3, Aug. Fierce Berserk (supremo) -> D4a.
 *
 * O TAMANHO da gema (quantas fatias ela usa) é uma ESCOLHA do usuário, limitada por
 * quantas das 3 fatias já estão maxadas em sequência (ver `maxGemSize`) — dá pra colocar
 * uma gema Lesser mesmo com as 3 fatias já maxadas (ela só usa a primeira, deixando as
 * outras 2 livres/sem bônus).
 *
 * Regras reais do jogo (`VesselInfos.GemInfo`/`VesselInfo`, mesmo endpoint):
 * - Lesser gem: 1 mod básico. Regular: 2 mods básicos. Greater: 2 básicos e 1 supremo.
 * - +1 Damage and Healing (Lesser/Regular) ou +2 (Greater) — bônus fixo por tamanho.
 * - O grau de upgrade dos mods (0-3, "Fragment Workshop") é UM SÓ pra gema inteira,
 *   compartilhado por todos os mods dela (correção anterior, ainda válida).
 *
 * SIMPLIFICAÇÃO CONHECIDA: o mod supremo deveria, no jogo real, ficar restrito aos que
 * combinam com o feitiço/perk daquele domínio específico; aqui oferecemos todos os mods
 * supremos da vocação (ver `SUPREME_MODS`), sem esse filtro por domínio.
 */
import data from '../data.yaml';
import gemData from '../gem-data.json';
import { iconCircle, iconSection } from './utils';
import { wheelIconUrlById } from './real-perk-icons';

export type GemSize = 0 | 1 | 2; // lesser, regular, greater — quantas fatias a gema usa

export const GEM_GRADE_NAMES = ['Lesser', 'Regular', 'Greater'] as const;

export interface GemModSlot {
  modIndex: number | null;
}

export interface GemState {
  size: GemSize;
  tier: number; // 0-3, grau de upgrade compartilhado por todos os mods desta gema
  basicMods: GemModSlot[]; // 1 item (Lesser) ou 2 (Regular/Greater)
  supremeMod: GemModSlot | null; // só existe se size === 2 (Greater)
}

export const BASIC_EFFECTS = gemData.basicEffects;
export const BASIC_MODS = gemData.basicMods;
export const SUPREME_MODS = gemData.supremeMods;
export const GEM_NAMES = gemData.gemNames as Record<Vocation, string[]>;
export const VESSEL_ACTIVATION = gemData.vesselActivation;

export function basicModsForSize(size: GemSize): number {
  return size === 0 ? 1 : 2;
}

export function hasSupremeSlot(size: GemSize): boolean {
  return size === 2;
}

export function basicModName(modIndex: number): string {
  const mod = BASIC_MODS[modIndex];
  return mod.effects.map((e) => BASIC_EFFECTS[e.effectId].name).join(' · ');
}

export function basicModValues(modIndex: number, vocation: Vocation, tier: number): string {
  const mod = BASIC_MODS[modIndex];
  return mod.effects.map((e) => e.values[vocation][tier]).join(', ');
}

/** Nome + valor de cada efeito, ex. "Fire Resistance (+3%) · Ice Resistance (-2%)"
 * (2026-09-05, pedido do usuário: "tem icerestance e fire resistence 2 vezes eu nao sei
 * sem clicar qual é qual" — vários mods combo compartilham o MESMO nome via
 * `basicModName` (ex.: índices 9 e 15 são ambos "Fire Resistance · Ice Resistance", mas
 * um é +1%/+1% e o outro é +3%/-2%); mostrar o valor junto do nome desambigua sem precisar
 * clicar, igual já fazemos pro mod supremo). */
export function basicModNameWithValues(modIndex: number, vocation: Vocation, tier: number): string {
  const mod = BASIC_MODS[modIndex];
  return mod.effects
    .map((e) => `${BASIC_EFFECTS[e.effectId].name} (${e.values[vocation][tier]})`)
    .join(' · ');
}

/** Mods básicos permitidos no 1º slot básico de QUALQUER gema — Lesser só tem esse slot,
 * mas Regular/Greater também usam essa mesma lista restrita pro slot 1 (correção
 * 2026-09-05, pedido do usuário: "no primeiro slot é o unico slot que pode aparecer vida,
 * assim como proteção com uma proteção negativa só pode no segundo" — a lista da print
 * anterior era do 1º slot, não da gema Lesser). Só resistência pura aos 4 elementos
 * clássicos, ou HP/Mana/Capacity puro/combinado com UM elemento. */
const FIRST_SLOT_ALLOWED_BASIC_MODS = [3, 4, 5, 6, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 44, 45, 46, 47, 48];

/** Mods básicos permitidos no 2º slot básico (só existe em Regular/Greater) — o restante
 * dos mods (2026-09-05): combos de dupla resistência elemental, inclusive os com penalidade
 * negativa num dos elementos, que não podem ir no 1º slot. */
function secondSlotAllowedBasicMods(): number[] {
  return BASIC_MODS
    .map((_, i) => i)
    .filter((i) => !FIRST_SLOT_ALLOWED_BASIC_MODS.includes(i) && BASIC_MODS[i].effects.length > 0);
}

export function basicModOptionsForSlot(slotIndex: number): number[] {
  if (slotIndex === 0) {
    return FIRST_SLOT_ALLOWED_BASIC_MODS.filter((i) => BASIC_MODS[i].effects.length > 0);
  }
  return secondSlotAllowedBasicMods();
}

export function supremeModsForVocation(vocation: Vocation) {
  return SUPREME_MODS
    .map((mod, index) => ({ ...mod, index }))
    .filter((mod) => mod.vocation === 'shared' || mod.vocation === vocation);
}

/** Índices (0-35) das 3 fatias de Vessel Resonance de um domínio (raw, 0-3), em ordem
 * crescente de anel — varia por domínio (não segue um padrão uniforme entre os 4). Posição
 * 0 = fatia de anel mais baixo (ex. D1), posição 1 = meio (D3), posição 2 = mais alto (D4a). */
export function domainVesselIndices(domain: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < 36; i++) {
    if (iconSection(i) === domain && data.conviction[data.perks.conviction.knight[i]]?.name?.startsWith('Vessel Resonance')) {
      indices.push(i);
    }
  }
  return indices.sort((a, b) => iconCircle(a) - iconCircle(b));
}

/** Posição (0, 1 ou 2) dessa fatia específica entre as 3 Vessel Resonance do domínio, em
 * ordem de anel. -1 se por algum motivo não for uma fatia de vessel. */
export function vesselSlotPosition(index: number): number {
  return domainVesselIndices(iconSection(index)).indexOf(index);
}

/** Nome do domínio pro indicativo "onde está selecionada a gema". */
const DOMAIN_COMPASS_NAME = ['Sudeste', 'Sudoeste', 'Noroeste', 'Nordeste'];

export function domainCompassName(domain: number): string {
  return DOMAIN_COMPASS_NAME[domain];
}

/** Esta fatia específica já foi maxada. */
export function vesselSlotUnlocked(perks: Record<number, number>, index: number): boolean {
  const ring = iconCircle(index);
  return (perks[index] ?? 0) >= data.pointsPerCircle[ring];
}

/** Quantas das 3 fatias do domínio já estão maxadas, em sequência a partir da 1ª (0-3) —
 * também o nível de Vessel Resonance (VR) do domínio pro texto oficial do jogo (Sealed/
 * Dormant/Awakened/Radiant). */
export function vesselResonanceLevel(perks: Record<number, number>, domain: number): number {
  const indices = domainVesselIndices(domain);
  let level = 0;

  for (const index of indices) {
    if (vesselSlotUnlocked(perks, index)) {
      level++;
    } else {
      break;
    }
  }

  return level;
}

/** Maior tamanho de gema que dá pra colocar nesse domínio agora (-1 = nenhuma fatia
 * maxada ainda, sem gema possível). O usuário pode escolher um tamanho MENOR que o
 * máximo disponível (ex.: colocar só uma Lesser mesmo com as 3 fatias já maxadas) —
 * nesse caso as fatias além do tamanho escolhido ficam sem bônus. */
export function maxGemSize(perks: Record<number, number>, domain: number): GemSize | -1 {
  return (vesselResonanceLevel(perks, domain) - 1) as GemSize | -1;
}

/** +1 Damage and Healing (Lesser/Regular) ou +2 (Greater). */
export function gemMatchBonus(size: GemSize): number {
  return size === 2 ? 2 : 1;
}

/** Ícone de proteção elemental (2026-09-05) — id do arquivo em src/assets/wheel-icons/
 * pra cada efeito básico "elemental" (Fogo/Terra/Gelo/Energia + Holy&Death combinado;
 * "Physical" fica de fora de propósito). Ver BASIC_EFFECTS pros índices (0=Physical,
 * 1=Holy, 2=Death, 3=Fire, 4=Earth, 5=Ice, 6=Energy). */
const ELEMENT_ICON_ID_BY_EFFECT: Record<number, string> = {
  1: 'resistance_holy_death',
  2: 'resistance_holy_death',
  3: 'resistance_fire',
  4: 'resistance_earth',
  5: 'resistance_ice',
  6: 'resistance_energy',
};

function elementIconForModIndex(modIndex: number): string | undefined {
  for (const effect of BASIC_MODS[modIndex].effects) {
    const iconId = ELEMENT_ICON_ID_BY_EFFECT[effect.effectId];
    if (iconId) {
      return wheelIconUrlById(iconId);
    }
  }
  return undefined;
}

/** Mod (se houver) atribuído à fatia NESSA posição específica (0/1/2) dentro do domínio —
 * 1 bônus por fatia, na ordem em que a gema preenche (2026-09-05, correção do usuário:
 * "cada vessel é um slot de bônus... o bonus de fogo deve ser no slot D1... o ultimo bonus
 * no D4a"). `null` se a gema não usa essa posição (tamanho pequeno demais) ou não há gema. */
export function modAtPosition(gem: GemState | null | undefined, position: number): GemModSlot | null {
  if (!gem) {
    return null;
  }
  if (position < gem.basicMods.length) {
    return gem.basicMods[position];
  }
  if (position === basicModsForSize(gem.size) && gem.supremeMod) {
    return gem.supremeMod;
  }
  return null;
}

/** Ícone de proteção elemental pra fatia NESSA posição, se o mod atribuído a ela for uma
 * proteção elemental — usado no lugar do ícone padrão do vessel vazio na roda. Mod supremo
 * (posição do meio pra fora numa Greater) nunca tem ícone de proteção — é sempre um
 * feitiço/buff, não resistência. */
export function gemElementIconUrlAtPosition(gem: GemState | null | undefined, position: number): string | undefined {
  if (!gem) {
    return undefined;
  }

  const isSupremePosition = position === basicModsForSize(gem.size);
  if (isSupremePosition) {
    return undefined;
  }

  const slot = modAtPosition(gem, position);
  return slot?.modIndex !== null && slot?.modIndex !== undefined
    ? elementIconForModIndex(slot.modIndex)
    : undefined;
}

export function createEmptyGem(size: GemSize): GemState {
  return {
    size,
    tier: 0,
    basicMods: new Array(basicModsForSize(size)).fill(0).map(() => ({ modIndex: null })),
    supremeMod: hasSupremeSlot(size) ? { modIndex: null } : null,
  };
}

/** Soma dos bônus de pontos de promoção do "Revelation Mastery" (2026-09-07, pedido do
 * usuário: "a gema que da pontos em alguma fatia não esta adicionando os pontos
 * (revelation masterys são as gemas)") — esse mod supremo dá +150/+165/+180/+225 pontos
 * pra roda inteira (ver TibiaWiki: "Up to 69 extra points can be obtained via upgrading
 * Basic and Supreme Mods"; o texto do mod já vem como "+150 Gift of Life" etc, com o nome
 * do Revelation Perk correspondente). Só conta quando a fatia de Vessel Resonance da
 * POSIÇÃO do mod supremo (a última das 3 do domínio) já está maxada — mesma regra de
 * qualquer outro mod da gema (ver `gemElementIconUrlAtPosition`/regra da wiki: "at least
 * one Vessel Resonance... has to be enabled before its bonuses start to be applied"). */
export function wheelPointsBonus(gems: Record<number, GemState | null>, perks: Record<number, number>): number {
  let total = 0;

  for (let domain = 0; domain < 4; domain++) {
    const gem = gems[domain];
    if (!gem?.supremeMod || gem.supremeMod.modIndex === null) {
      continue;
    }

    const supremePosition = basicModsForSize(gem.size);
    const vesselIndex = domainVesselIndices(domain)[supremePosition];
    if (vesselIndex === undefined || !vesselSlotUnlocked(perks, vesselIndex)) {
      continue;
    }

    const mod = SUPREME_MODS[gem.supremeMod.modIndex];
    if (!mod.name.startsWith('Revelation Mastery')) {
      continue;
    }

    const points = parseInt(mod.values[gem.tier], 10);
    if (!isNaN(points)) {
      total += points;
    }
  }

  return total;
}

export interface BasicModTotal {
  effectId: number;
  /** Já formatado (ex.: "+2%", "+300", "27.50%") — soma de todas as gemas ativas que dão
   * esse efeito, no mesmo formato (`BASIC_EFFECTS[effectId].format`) do efeito original. */
  text: string;
}

/** Extrai o número (com sinal) do início de um valor já formatado tipo "+1.5%"/"-2%"/"+300"
 * — os valores de BASIC_MODS já vêm formatados por vocação/grau (sem campo numérico cru
 * separado), então somar 2 gemas com o mesmo efeito exige reconverter texto->número->texto. */
function parseSignedNumber(value: string): number {
  const match = /^([+-]?\d+(?:\.\d+)?)/.exec(value.trim());
  return match ? parseFloat(match[1]) : 0;
}

function formatEffectTotal(effectId: number, sum: number): string {
  const format = BASIC_EFFECTS[effectId].format;
  if (format === 'PlusInteger') {
    return `${sum >= 0 ? '+' : ''}${Math.round(sum)}`;
  }
  if (format === 'PercentWithTwoFloatingpoints') {
    return `${sum.toFixed(2)}%`;
  }
  // PlusPercentWithUpToTwoFloatingpoints (resistências) — arredonda pra 2 casas e tira
  // zero à direita desnecessário (Number() já faz isso na conversão de volta pra string).
  const rounded = Number(sum.toFixed(2));
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

/** Soma os mods BÁSICOS ativos de todas as gemas equipadas, agrupados por efeito (ex.: 2
 * domínios dando Fire Resistance viram um "+2%" só) — usado pro Summary.tsx juntar esses
 * valores no card de Dedication Perks, igual o jogo real faz (2026-09-08, pedido do
 * usuário com print de referência do client oficial: "a gema selecionada deve aparecer em
 * dedications perks somando todos os valores"). Só mods SUPREMOS ficam de fora (não são
 * stats simples tipo dedication, são bônus de dano/crítico/cooldown). Mesma regra de
 * ativação por posição de `wheelPointsBonus`/`gemElementIconUrlAtPosition` — só conta
 * quando a fatia de Vessel Resonance daquela posição já está maxada. */
export function activeBasicModTotals(
  gems: Record<number, GemState | null>,
  perks: Record<number, number>,
  vocation: Vocation,
): BasicModTotal[] {
  const sums = new Map<number, number>();

  for (let domain = 0; domain < 4; domain++) {
    const gem = gems[domain];
    if (!gem) {
      continue;
    }

    gem.basicMods.forEach((slot, position) => {
      if (slot.modIndex === null) {
        return;
      }
      const vesselIndex = domainVesselIndices(domain)[position];
      if (vesselIndex === undefined || !vesselSlotUnlocked(perks, vesselIndex)) {
        return;
      }

      for (const effect of BASIC_MODS[slot.modIndex].effects) {
        const value = parseSignedNumber(effect.values[vocation][gem.tier]);
        sums.set(effect.effectId, (sums.get(effect.effectId) ?? 0) + value);
      }
    });
  }

  return Array.from(sums.entries())
    .filter(([, sum]) => sum !== 0)
    .map(([effectId, sum]) => ({ effectId, text: formatEffectTotal(effectId, sum) }));
}
