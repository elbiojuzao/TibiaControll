import type { WheelSliceGeometry } from '@/types';

/** Geometria REAL da Roda de Destino — extraída em 2026-09-02 direto do código-fonte do
 * wheel-planner do tibiapal.com (scripts/wod-assets/wheelofdestinyplanner.min.js), não
 * inventada. Cada um dos 4 domínios (TopLeft 180-270°/TopRight 270-360°/BottomLeft
 * 90-180°/BottomRight 0-90°) tem exatamente 9 fatias num formato de losango: 1 fatia no
 * anel 0 (centro, ocupa o quadrante inteiro), 2 no anel 1, 3 no anel 2 (o mais largo), 2 no
 * anel 3, 1 grande no anel 4 (a ponta — Revelation Perk). Total 36 fatias.
 *
 * Raio de cada anel: `on(r) = r*52+1`, `un(r) = on(r)+50` (constantes reais do tibiapal:
 * espessura de anel = 50px, gap entre anéis = 2px) — canvas de referência 522×522, centro
 * em (261,261). Usamos esses valores direto como viewBox do SVG, então a PROPORÇÃO entre
 * anéis/fatias fica idêntica ao jogo, só escalada pro tamanho que a tela pedir. */
export const WHEEL_CENTER = 261;
export const WHEEL_VIEWBOX_SIZE = 522;

const RING_THICKNESS = 50;
const RING_GAP = 2;

export function ringInnerRadius(ring: number): number {
  return ring * (RING_THICKNESS + RING_GAP) + 1;
}

export function ringOuterRadius(ring: number): number {
  return ringInnerRadius(ring) + RING_THICKNESS;
}

/** As 36 fatias, geometria idêntica ao jogo (mesmos ids/ângulos/anéis do tibiapal — QTL =
 * Quadrant Top-Left, QTR = Top-Right, QBL = Bottom-Left, QBR = Bottom-Right). */
export const WHEEL_SLICE_GEOMETRY: WheelSliceGeometry[] = [
  // TopLeft (domínio 0) — 180° a 270°
  { id: 'QTL0', domain: 0, ring: 0, startAngleDeg: 180, endAngleDeg: 270 },
  { id: 'QTL1', domain: 0, ring: 1, startAngleDeg: 180, endAngleDeg: 225 },
  { id: 'QTL3', domain: 0, ring: 1, startAngleDeg: 225, endAngleDeg: 270 },
  { id: 'QTL2', domain: 0, ring: 2, startAngleDeg: 180, endAngleDeg: 210 },
  { id: 'QTL4', domain: 0, ring: 2, startAngleDeg: 210, endAngleDeg: 240 },
  { id: 'QTL6', domain: 0, ring: 2, startAngleDeg: 240, endAngleDeg: 270 },
  { id: 'QTL5', domain: 0, ring: 3, startAngleDeg: 195, endAngleDeg: 225 },
  { id: 'QTL7', domain: 0, ring: 3, startAngleDeg: 225, endAngleDeg: 255 },
  { id: 'QTL8', domain: 0, ring: 4, startAngleDeg: 195, endAngleDeg: 255 },

  // TopRight (domínio 1) — 270° a 360°
  { id: 'QTR0', domain: 1, ring: 0, startAngleDeg: 270, endAngleDeg: 360 },
  { id: 'QTR3', domain: 1, ring: 1, startAngleDeg: 270, endAngleDeg: 315 },
  { id: 'QTR1', domain: 1, ring: 1, startAngleDeg: 315, endAngleDeg: 360 },
  { id: 'QTR6', domain: 1, ring: 2, startAngleDeg: 270, endAngleDeg: 300 },
  { id: 'QTR4', domain: 1, ring: 2, startAngleDeg: 300, endAngleDeg: 330 },
  { id: 'QTR2', domain: 1, ring: 2, startAngleDeg: 330, endAngleDeg: 360 },
  { id: 'QTR7', domain: 1, ring: 3, startAngleDeg: 285, endAngleDeg: 315 },
  { id: 'QTR5', domain: 1, ring: 3, startAngleDeg: 315, endAngleDeg: 345 },
  { id: 'QTR8', domain: 1, ring: 4, startAngleDeg: 285, endAngleDeg: 345 },

  // BottomLeft (domínio 2) — 90° a 180°
  { id: 'QBL0', domain: 2, ring: 0, startAngleDeg: 90, endAngleDeg: 180 },
  { id: 'QBL3', domain: 2, ring: 1, startAngleDeg: 90, endAngleDeg: 135 },
  { id: 'QBL1', domain: 2, ring: 1, startAngleDeg: 135, endAngleDeg: 180 },
  { id: 'QBL6', domain: 2, ring: 2, startAngleDeg: 90, endAngleDeg: 120 },
  { id: 'QBL4', domain: 2, ring: 2, startAngleDeg: 120, endAngleDeg: 150 },
  { id: 'QBL2', domain: 2, ring: 2, startAngleDeg: 150, endAngleDeg: 180 },
  { id: 'QBL7', domain: 2, ring: 3, startAngleDeg: 105, endAngleDeg: 135 },
  { id: 'QBL5', domain: 2, ring: 3, startAngleDeg: 135, endAngleDeg: 165 },
  { id: 'QBL8', domain: 2, ring: 4, startAngleDeg: 105, endAngleDeg: 165 },

  // BottomRight (domínio 3) — 0° a 90°
  { id: 'QBR0', domain: 3, ring: 0, startAngleDeg: 0, endAngleDeg: 90 },
  { id: 'QBR1', domain: 3, ring: 1, startAngleDeg: 0, endAngleDeg: 45 },
  { id: 'QBR3', domain: 3, ring: 1, startAngleDeg: 45, endAngleDeg: 90 },
  { id: 'QBR2', domain: 3, ring: 2, startAngleDeg: 0, endAngleDeg: 30 },
  { id: 'QBR4', domain: 3, ring: 2, startAngleDeg: 30, endAngleDeg: 60 },
  { id: 'QBR6', domain: 3, ring: 2, startAngleDeg: 60, endAngleDeg: 90 },
  { id: 'QBR5', domain: 3, ring: 3, startAngleDeg: 15, endAngleDeg: 45 },
  { id: 'QBR7', domain: 3, ring: 3, startAngleDeg: 45, endAngleDeg: 75 },
  { id: 'QBR8', domain: 3, ring: 4, startAngleDeg: 15, endAngleDeg: 75 },
];

function polarToXY(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/** Path SVG de 1 fatia (setor de anel/"annulus sector") — usado por WheelDiagram.tsx pra
 * desenhar cada uma das 36 fatias com a geometria real acima. */
export function sliceArcPath(slice: WheelSliceGeometry, cx = WHEEL_CENTER, cy = WHEEL_CENTER): string {
  const inner = ringInnerRadius(slice.ring);
  const outer = ringOuterRadius(slice.ring);
  const [x1, y1] = polarToXY(cx, cy, outer, slice.startAngleDeg);
  const [x2, y2] = polarToXY(cx, cy, outer, slice.endAngleDeg);
  const [x3, y3] = polarToXY(cx, cy, inner, slice.endAngleDeg);
  const [x4, y4] = polarToXY(cx, cy, inner, slice.startAngleDeg);
  const largeArc = slice.endAngleDeg - slice.startAngleDeg > 180 ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}

/** Ponto central de 1 fatia (pro ícone/label desenhado por cima). */
export function sliceCenterXY(slice: WheelSliceGeometry, cx = WHEEL_CENTER, cy = WHEEL_CENTER): [number, number] {
  const midAngle = (slice.startAngleDeg + slice.endAngleDeg) / 2;
  const midRadius = (ringInnerRadius(slice.ring) + ringOuterRadius(slice.ring)) / 2;
  return polarToXY(cx, cy, midRadius, midAngle);
}

/** 2 fatias são ADJACENTES (pra fins de desbloqueio) se: (a) MESMO ANEL com ângulos que se
 * tocam numa borda comum ("lateral") — isso vale mesmo entre domínios DIFERENTES, contanto
 * que sejam vizinhos no círculo (a borda-limite entre 2 domínios conta como uma borda comum
 * qualquer, o anel inteiro dá a volta no relógio passando pelos 4 domínios); ou (b) MESMO
 * domínio, anéis vizinhos (diferença de 1) com ângulos que se sobrepõem ("radial" — a fatia
 * de fora fica "por cima" de 1 ou mais fatias de dentro; radial NÃO atravessa domínio, cada
 * domínio tem seu próprio "cone" central).
 *
 * Confirmado testando direto no tibiapal.com em 2026-09-03 (usuário: "a liberação de cada
 * sloot é sempre em cruz mesmo que no anterior não tenha sido completado ele ainda pode ser
 * preenchido se pela fatia do lado tiver sido preenchido um sloot que faça divisa com ele"):
 * preencher SÓ o anel0 de um domínio NÃO destrava o anel1 do domínio vizinho (confirma que
 * radial não atravessa domínio); preencher o anel1 (ATÉ O MÁXIMO) de um domínio destrava
 * diretamente o anel1 do domínio vizinho do lado, mesmo sem tocar o anel2 (confirma lateral
 * mesmo-anel atravessando domínio). Substitui a versão anterior que restringia toda
 * adjacência a `a.domain === b.domain`. */
export function slicesAdjacent(a: WheelSliceGeometry, b: WheelSliceGeometry): boolean {
  if (a.id === b.id) return false;
  if (a.ring === b.ring) {
    const aEnd = a.endAngleDeg % 360;
    const bEnd = b.endAngleDeg % 360;
    return aEnd === b.startAngleDeg || bEnd === a.startAngleDeg;
  }
  if (a.domain === b.domain && Math.abs(a.ring - b.ring) === 1) {
    return a.startAngleDeg < b.endAngleDeg && b.startAngleDeg < a.endAngleDeg;
  }
  return false;
}
