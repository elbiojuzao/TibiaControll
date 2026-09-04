import type { DedicationPerkId, WheelConvictionKind, WheelDomainId, WheelRing, WheelVocation } from '@/types';
import { DEDICATION_PERKS, GENERIC_CONVICTION_PERKS, VOCATION_AUGMENTATIONS, VOCATION_UNIQUE_CONVICTIONS } from './wheel-perks-data';
import { getWheelIconUrl } from './wheel-icons';

/** Mapeamento EXATO fatia→conteúdo da Wheel of Destiny, extraído direto do tibiapal.com em
 * 2026-09-03 (pedido do usuário: "as imagens estao erradas e nas posições erradas... faça
 * identica a ela inclusive os bonus"). Método: simular hover em cada uma das 36 fatias do
 * canvas (`canvas.dispatchEvent(new MouseEvent('mousemove', {clientX, clientY}))`,
 * coordenadas calculadas a partir da geometria real) e ler o painel "Information" que a
 * própria ferramenta preenche, pras 4 vocações (Knight/Paladin/Druid/Sorcerer). Cada fatia
 * tem SEMPRE 1 Dedication Perk + 1 Conviction Perk simultâneos — não é escolha do jogador,
 * só os PONTOS investidos são ajustáveis (teto real por anel: 50/75/100/150/200).
 *
 * Dedication Perk: o TIPO gira por domínio numa rotação fixa (mesma pra qualquer vocação —
 * confirmado comparando as 4 extrações, o Dedication não muda com a vocação):
 * domínio 0 (Verde): anel0=Capacity, anel1=Mana, anel2=HitPoints, anel3=Mitigation
 * domínio 1 (Vermelho): anel0=Mitigation, anel1=Capacity, anel2=Mana, anel3=HitPoints
 * domínio 2 (Turquesa): anel0=Mana, anel1=HitPoints, anel2=Mitigation, anel3=Capacity
 * domínio 3 (Roxo): anel0=HitPoints, anel1=Mitigation, anel2=Capacity, anel3=Mana
 * anel4 (todos os domínios): sempre Hit Points & Mana combinado.
 *
 * Conviction Perk: a ESTRUTURA (qual tipo de conviction cada uma das 36 posições carrega)
 * também é idêntica nas 4 vocações — só o conteúdo de 'augmented'/'unique' muda de vocação
 * pra vocação (ver VOCATION_WHEEL_PLACEMENT abaixo). Estrutura completa em
 * WHEEL_SLICE_STRUCTURE. */

export function ringPointCap(ring: WheelRing): number {
  switch (ring) {
    case 0: return 50;
    case 1: return 75;
    case 2: return 100;
    case 3: return 150;
    case 4: return 200;
  }
}

/** Custo total de 1 domínio (8 fatias preenchíveis, anel4 incluso — dado real do tibiapal:
 * 50 + 2×75 + 3×100 + 2×150 + 200 = 1000 pontos). */
export const DOMAIN_TOTAL_POINTS = ringPointCap(0) + 2 * ringPointCap(1) + 3 * ringPointCap(2) + 2 * ringPointCap(3) + ringPointCap(4);

const DEDICATION_ROTATION: Record<WheelDomainId, DedicationPerkId[]> = {
  0: ['capacity', 'mana', 'hitpoints', 'mitigation'],
  1: ['mitigation', 'capacity', 'mana', 'hitpoints'],
  2: ['mana', 'hitpoints', 'mitigation', 'capacity'],
  3: ['hitpoints', 'mitigation', 'capacity', 'mana'],
};

export function dedicationForSlice(domain: WheelDomainId, ring: WheelRing): DedicationPerkId {
  if (ring === 4) return 'hitpoints_mana';
  return DEDICATION_ROTATION[domain][ring];
}

/** Placeholder de "qual das 5 augmentations" / "qual das 2 unique convictions" ocupa uma
 * posição estrutural — resolvido pra um id real via VOCATION_WHEEL_PLACEMENT. */
type AugSlot = 'A' | 'B' | 'C' | 'D' | 'E';
type UniqueSlot = 'D0' | 'D3';

interface SliceStructureEntry {
  kind: WheelConvictionKind;
  augSlot?: AugSlot;
  uniqueSlot?: UniqueSlot;
}

/** As 36 posições — mesma estrutura em qualquer vocação (ver ids reais em
 * wheel-geometry.ts). augA/augB = par anel0↔anel4 (domínios 1↔2, trocados); augC/augD = par
 * anel2↔anel2 (domínios 0↔3, trocados); augE = par anel2↔anel2 (domínios 1↔2, mesma
 * augmentation nos 2). uniqueD0/uniqueD3 = as 2 Conviction únicas da vocação, sempre no
 * anel4 dos domínios 0 e 3. */
export const WHEEL_SLICE_STRUCTURE: Record<string, SliceStructureEntry> = {
  QTL0: { kind: 'vessel' },
  QTL1: { kind: 'skillboost' },
  QTL3: { kind: 'lifeleech' },
  QTL2: { kind: 'augmented', augSlot: 'C' },
  QTL4: { kind: 'augmented', augSlot: 'D' },
  QTL6: { kind: 'vessel' },
  QTL5: { kind: 'vessel' },
  QTL7: { kind: 'manaleech' },
  QTL8: { kind: 'unique', uniqueSlot: 'D0' },

  QTR0: { kind: 'augmented', augSlot: 'A' },
  QTR3: { kind: 'vessel' },
  QTR1: { kind: 'lifeleech' },
  QTR6: { kind: 'skillboost' },
  QTR4: { kind: 'augmented', augSlot: 'E' },
  QTR2: { kind: 'vessel' },
  QTR7: { kind: 'vessel' },
  QTR5: { kind: 'manaleech' },
  QTR8: { kind: 'augmented', augSlot: 'B' },

  QBL0: { kind: 'augmented', augSlot: 'B' },
  QBL3: { kind: 'vessel' },
  QBL1: { kind: 'manaleech' },
  QBL6: { kind: 'skillboost' },
  QBL4: { kind: 'augmented', augSlot: 'E' },
  QBL2: { kind: 'vessel' },
  QBL7: { kind: 'vessel' },
  QBL5: { kind: 'lifeleech' },
  QBL8: { kind: 'augmented', augSlot: 'A' },

  QBR0: { kind: 'vessel' },
  QBR1: { kind: 'skillboost' },
  QBR3: { kind: 'manaleech' },
  QBR2: { kind: 'augmented', augSlot: 'D' },
  QBR4: { kind: 'augmented', augSlot: 'C' },
  QBR6: { kind: 'vessel' },
  QBR5: { kind: 'vessel' },
  QBR7: { kind: 'lifeleech' },
  QBR8: { kind: 'unique', uniqueSlot: 'D3' },
};

interface VocationPlacement {
  augA: string; augB: string; augC: string; augD: string; augE: string;
  uniqueD0: string; uniqueD3: string;
}

/** Qual perk real ocupa cada posição estrutural, por vocação — ids batem com
 * VOCATION_AUGMENTATIONS/VOCATION_UNIQUE_CONVICTIONS em wheel-perks-data.ts. Extraído direto
 * do tibiapal (ex: "a primeira de exori min do ek [augA, anel0 domínio1] dá bônus de mana"
 * → Fierce Berserk custa mana, confere com o pedido do usuário). */
export const VOCATION_WHEEL_PLACEMENT: Record<WheelVocation, VocationPlacement> = {
  knight: {
    augA: 'fierce_berserk', augB: 'front_sweep', augC: 'intense_wound_cleansing', augD: 'shield_slam', augE: 'groundshaker',
    uniqueD0: 'battle_instinct', uniqueD3: 'battle_healing',
  },
  paladin: {
    augA: 'divine_caldera', augB: 'ethereal_barrage', augC: 'divine_barrage', augD: 'strong_ethereal_spear', augE: 'divine_dazzle',
    uniqueD0: 'positional_tactics', uniqueD3: 'ballistic_mastery',
  },
  druid: {
    augA: 'strong_ice_wave', augB: 'forked_spells', augC: 'terra_wave', augD: 'mass_healing', augE: 'heal_friend',
    uniqueD0: 'healing_link', uniqueD3: 'runic_mastery',
  },
  sorcerer: {
    augA: 'great_fire_wave', augB: 'focus_spells', augC: 'energy_wave', augD: 'special_spells', augE: 'death_echo',
    uniqueD0: 'runic_mastery', uniqueD3: 'focus_mastery',
  },
};

export interface ResolvedSliceConviction {
  kind: WheelConvictionKind;
  name: string;
  description: string;
  iconUrl?: string;
  emoji?: string;
}

function genericConviction(id: 'manaleech' | 'lifeleech' | 'skillboost' | 'vesselresonance', domain: WheelDomainId): ResolvedSliceConviction {
  const perk = GENERIC_CONVICTION_PERKS.find((p) => p.id === id)!;
  const name = id === 'vesselresonance' ? `${perk.name} — ${WHEEL_DOMAIN_LABEL[domain]}` : perk.name;
  const iconUrl = id === 'vesselresonance' ? undefined : getWheelIconUrl(id);
  return { kind: id === 'vesselresonance' ? 'vessel' : (id as WheelConvictionKind), name, description: perk.description, iconUrl, emoji: perk.icon };
}

/** Resolve o Conviction Perk REAL (nome/descrição/ícone) de uma fatia, pra uma vocação. */
export function resolveSliceConviction(vocation: WheelVocation, sliceId: string, domain: WheelDomainId): ResolvedSliceConviction {
  const entry = WHEEL_SLICE_STRUCTURE[sliceId];
  const placement = VOCATION_WHEEL_PLACEMENT[vocation];

  switch (entry.kind) {
    case 'vessel':
      return genericConviction('vesselresonance', domain);
    case 'skillboost':
      return genericConviction('skillboost', domain);
    case 'manaleech':
      return genericConviction('manaleech', domain);
    case 'lifeleech':
      return genericConviction('lifeleech', domain);
    case 'augmented': {
      const id = placement[`aug${entry.augSlot}` as 'augA' | 'augB' | 'augC' | 'augD' | 'augE'];
      const aug = VOCATION_AUGMENTATIONS[vocation].find((a) => a.id === id)!;
      return { kind: 'augmented', name: aug.ability, description: `${aug.stage1} ${aug.stage2}`, iconUrl: getWheelIconUrl(aug.id) };
    }
    case 'unique': {
      const id = entry.uniqueSlot === 'D0' ? placement.uniqueD0 : placement.uniqueD3;
      const unique = VOCATION_UNIQUE_CONVICTIONS[vocation].find((u) => u.id === id)!;
      return { kind: 'unique', name: unique.name, description: unique.description, iconUrl: getWheelIconUrl(unique.id) };
    }
  }
}

export function resolveSliceDedication(domain: WheelDomainId, ring: WheelRing): { id: DedicationPerkId; name: string; description: string; icon: string; iconUrl?: string } {
  const id = dedicationForSlice(domain, ring);
  const perk = DEDICATION_PERKS.find((p) => p.id === id)!;
  return { ...perk, iconUrl: getWheelIconUrl(id) };
}

/** Cores reais dos 4 domínios — extraídas do código-fonte do tibiapal (mesmos hex usados
 * pelo jogo/planner de verdade). `empty`/`filled` são as 2 variantes de opacidade que a
 * própria ferramenta usa (fatia vazia vs. preenchida). */
export const WHEEL_DOMAIN_COLORS: Record<WheelDomainId, { empty: string; filled: string; solid: string }> = {
  0: { empty: '#46b21c31', filled: '#94c4126b', solid: '#7dd321' },
  1: { empty: '#ae143431', filled: '#ef1a386b', solid: '#ef1a38' },
  2: { empty: '#198d4031', filled: '#18cd8f6b', solid: '#18cd8f' },
  3: { empty: '#841d9e31', filled: '#e618da6b', solid: '#e618da' },
};

export const WHEEL_DOMAIN_LABEL: Record<WheelDomainId, string> = {
  0: 'Verde',
  1: 'Vermelho',
  2: 'Turquesa',
  3: 'Roxo',
};
