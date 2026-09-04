/** Roda de Destino (Wheel of Destiny) — pedido do usuário em 2026-09-02: "eu queria fazer
 * um modulo de roda de habilidades... parecido com tibiapal.com/wheel-planner... precisamos
 * montar a roda igual idêntica pois é como é no jogo". A GEOMETRIA da roda (4 domínios × 9
 * fatias em formato de losango — 1/2/3/2/1 por anel, ângulos exatos) veio direto do
 * código-fonte real do tibiapal (ver services/wheel/wheel-geometry.ts). O CONTEÚDO de cada
 * fatia (qual perk específico ocupa qual uma das 36 posições, por vocação) foi extraído
 * DIRETO do tibiapal.com em 2026-09-03 (pedido do usuário: "as imagens estao erradas e nas
 * posições erradas... faça identica a ela") — simulando hover real em cada fatia do canvas
 * (`canvas.dispatchEvent(new MouseEvent('mousemove', ...))`) e lendo o painel de
 * informação que a própria ferramenta preenche em resposta, pras 4 vocações. Cada fatia tem
 * SEMPRE 1 Dedication Perk + 1 Conviction Perk (não é escolha do jogador — só os PONTOS
 * investidos são ajustáveis, até o teto real de cada anel: 50/75/100/150/200). Ver
 * services/wheel/wheel-slice-content.ts pro mapeamento exato. */

export type WheelVocation = 'knight' | 'druid' | 'sorcerer' | 'paladin';

/** 4 domínios da roda (sentido horário a partir do topo-esquerdo) — cada um com sua cor e
 * seu próprio Revelation Perk fixo. Não confundir com WheelRing (posição radial). */
export type WheelDomainId = 0 | 1 | 2 | 3;

/** Posição radial da fatia: 0 = centro (Dedication), 4 = ponta externa (Revelation). */
export type WheelRing = 0 | 1 | 2 | 3 | 4;

/** Geometria de 1 fatia — igual pra qualquer vocação (a forma da roda não muda, só o
 * conteúdo). Extraída do código-fonte real do wheel-planner do tibiapal.com. */
export interface WheelSliceGeometry {
  id: string;
  domain: WheelDomainId;
  ring: WheelRing;
  startAngleDeg: number;
  endAngleDeg: number;
}

/** O TIPO de Conviction Perk que ocupa uma fatia — fixo por posição, igual em todas as
 * vocações (só o `augmented`/`unique` mudam de CONTEÚDO conforme a vocação, ver
 * VOCATION_WHEEL_PLACEMENT em wheel-slice-content.ts). */
export type WheelConvictionKind = 'vessel' | 'skillboost' | 'manaleech' | 'lifeleech' | 'augmented' | 'unique';

export type DedicationPerkId = 'hitpoints' | 'mana' | 'hitpoints_mana' | 'capacity' | 'mitigation';

export type GenericConvictionId = 'manaleech' | 'lifeleech' | 'skillboost' | 'vesselresonance';

export interface WheelAugmentation {
  id: string;
  ability: string;
  stage1: string;
  stage2: string;
}

export interface WheelRevelationPerk {
  id: string;
  name: string;
  description: string;
  stage1: string;
  stage2: string;
  stage3: string;
}

/** Conviction Perk único da vocação — ex: Battle Healing/Battle Instinct pro Knight. Ocupa
 * sempre 1 fatia do anel 4 (200 pontos, teto real do anel). */
export interface WheelUniqueConviction {
  id: string;
  name: string;
  description: string;
}

/** Quanto foi investido numa fatia específica da roda salva — o CONTEÚDO da fatia é fixo
 * por posição+vocação (ver wheel-slice-content.ts), só os pontos são ajustáveis. */
export interface WheelSliceAllocation {
  sliceId: string;
  points: number;
}

export type GemSize = 'lesser' | 'regular' | 'greater';

/** Nº de Vessel Resonances habilitadas num domínio (0 a 3) — precisa bater ou passar do nº
 * de mod slots do maior gem socketado ali pra ele dar bônus completo (ver TibiaWiki: Gem
 * Atelier). */
export interface WheelGemVessel {
  domain: WheelDomainId;
  enabledCount: number;
}

export interface WheelGem {
  id: string;
  size: GemSize;
  /** Afinidade de domínio atual do gem — só socketa em vessel do mesmo domínio (pode girar
   * pro próximo sentido horário, tem custo, ver gem-atelier-data.ts). */
  domain: WheelDomainId;
  revealed: boolean;
  /** Grau de cada mod já revelado (0=Grau I .. 3=Grau IV) — length bate com o nº de mod
   * slots do tamanho (Lesser=1, Regular=2, Greater=3). */
  modGrades: number[];
}

export interface WheelBuild {
  id: string;
  accountId: string;
  vocation: WheelVocation;
  name: string;
  characterName?: string;
  totalPoints: number;
  allocations: WheelSliceAllocation[];
  vessels: WheelGemVessel[];
  gems: WheelGem[];
  createdAt: string;
}

export interface CreateWheelBuildDto {
  vocation: WheelVocation;
  name: string;
  characterName?: string;
  totalPoints: number;
  allocations: WheelSliceAllocation[];
  vessels: WheelGemVessel[];
  gems: WheelGem[];
}
