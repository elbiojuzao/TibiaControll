import { WHEEL_SLICE_GEOMETRY, sliceArcPath, sliceCenterXY, ringOuterRadius } from '@/services/wheel/wheel-geometry';
import { WHEEL_DOMAIN_COLORS, ringPointCap, resolveSliceConviction, resolveSliceDedication } from '@/services/wheel/wheel-slice-content';
import { isSliceUnlocked, domainRevelationStage, type AllocationMap } from '@/services/wheel/wheel-logic';
import { VOCATION_REVELATION_PERKS } from '@/services/wheel/wheel-perks-data';
import { getWheelIconUrl } from '@/services/wheel/wheel-icons';
import type { WheelDomainId, WheelVocation } from '@/types';

interface WheelDiagramProps {
  vocation: WheelVocation;
  allocations: AllocationMap;
  selectedSliceId: string | null;
  onSelectSlice: (sliceId: string) => void;
}

const ICON_SIZE = 26;

/** Layout do quadro ornamentado — centro deslocado (320,320) num viewBox maior (640) pra
 * caber os 4 medalhões de Revelation Perk nos CANTOS, integrados na própria roda (não mais
 * um painel embaixo) — pedido do usuário 2026-09-03, com print real do jogo como
 * referência: "olhe pra esta imagem a roda tem que ser IGUAL esta é a de knight". A
 * geometria das 36 fatias em si (services/wheel/wheel-geometry.ts) não muda — só o centro
 * usado pro desenho é outro (sliceArcPath/sliceCenterXY aceitam cx/cy custom). */
const FRAME = 640;
const CENTER = 320;
const MEDALLION_R = 40;
const MEDALLION_OFFSET = 76;

const DOMAIN_CORNER: Record<WheelDomainId, { x: number; y: number }> = {
  0: { x: MEDALLION_OFFSET, y: MEDALLION_OFFSET },
  1: { x: FRAME - MEDALLION_OFFSET, y: MEDALLION_OFFSET },
  2: { x: MEDALLION_OFFSET, y: FRAME - MEDALLION_OFFSET },
  3: { x: FRAME - MEDALLION_OFFSET, y: FRAME - MEDALLION_OFFSET },
};

/** As 4 "torres" ornamentais nos pontos cardeais (topo/direita/baixo/esquerda), entre os
 * medalhões de canto — trapézio dourado com um pequeno círculo de topo, aproximando a
 * moldura em formato de gate/pedestal do print real do jogo (2026-09-03, usuário mandou
 * uma 2ª referência mais nítida: "gostaria que deixasse mais parecido ainda com o da
 * imagem"). `angle` gira o trapézio pra sempre apontar pra fora do quadro. */
const CARDINAL_TOWERS: { x: number; y: number; angle: number }[] = [
  { x: CENTER, y: 14, angle: 0 },
  { x: FRAME - 14, y: CENTER, angle: 90 },
  { x: CENTER, y: FRAME - 14, angle: 180 },
  { x: 14, y: CENTER, angle: 270 },
];

/** Desenho da Roda de Destino num quadro dourado ornamentado — geometria das 36 fatias
 * 100% real (extraída do tibiapal.com), estilo visual aproximado de 2 prints reais do jogo
 * (2026-09-02 e 2026-09-03, esse 2º mais nítido — usuário: "gostaria que deixasse mais
 * parecido ainda com o da imagem"): moldura dourada com borda dupla, fundo escuro, 4
 * "torres" ornamentais em formato de gate/pedestal nos pontos cardeais (trapézio + círculo
 * de topo — `CARDINAL_TOWERS`), medalhões de Revelation Perk nos 4 CANTOS com uma coroa de
 * rebites dourados ao redor (clicáveis, cadeado enquanto estágio 0). Cada fatia mostra o
 * ícone do seu Conviction Perk fixo (resolveSliceConviction) dentro de um badge circular
 * colorido pelo domínio, com o ícone do Dedication Perk como badge menor sobreposto. Renderiza
 * em até 820px (antes 640px — "deixe tambem maior a roda para ser mais visível"), dentro de
 * `.wheel-layout-grid` (global.css) que dá 3fr pra roda e 2fr pro painel de detalhe. */
export function WheelDiagram({ vocation, allocations, selectedSliceId, onSelectSlice }: WheelDiagramProps) {
  return (
    <svg
      viewBox={`0 0 ${FRAME} ${FRAME}`}
      style={{ width: '100%', maxWidth: '820px', height: 'auto', display: 'block', margin: '0 auto' }}
    >
      <defs>
        <linearGradient id="wheelGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4d98b" />
          <stop offset="30%" stopColor="#a9761f" />
          <stop offset="55%" stopColor="#f9e8b0" />
          <stop offset="80%" stopColor="#8a5f16" />
          <stop offset="100%" stopColor="#e8c877" />
        </linearGradient>
        <radialGradient id="wheelBg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#241d14" />
          <stop offset="70%" stopColor="#15100a" />
          <stop offset="100%" stopColor="#0b0805" />
        </radialGradient>
      </defs>

      <rect x={2} y={2} width={FRAME - 4} height={FRAME - 4} rx={28} fill="url(#wheelBg)" stroke="url(#wheelGold)" strokeWidth={6} />
      <rect x={12} y={12} width={FRAME - 24} height={FRAME - 24} rx={20} fill="none" stroke="url(#wheelGold)" strokeWidth={1.5} opacity={0.55} />

      {CARDINAL_TOWERS.map((t, i) => (
        <g key={`tower-${i}`} transform={`translate(${t.x} ${t.y}) rotate(${t.angle})`}>
          <polygon points="-18,20 18,20 11,-6 0,-24 -11,-6" fill="url(#wheelGold)" stroke="#5c3f0f" strokeWidth={1.5} />
          <circle cx={0} cy={-24} r={5} fill="#15100a" stroke="url(#wheelGold)" strokeWidth={2} />
        </g>
      ))}

      <circle cx={CENTER} cy={CENTER} r={ringOuterRadius(4) + 6} fill="var(--color-bg-input)" stroke="url(#wheelGold)" strokeWidth={2.5} />

      {WHEEL_SLICE_GEOMETRY.map((slice) => {
        const domain = slice.domain as WheelDomainId;
        const colors = WHEEL_DOMAIN_COLORS[domain];
        const alloc = allocations[slice.id];
        const maxPoints = ringPointCap(slice.ring);
        const fillRatio = Math.min(1, (alloc?.points ?? 0) / maxPoints);
        const unlocked = isSliceUnlocked(slice.id, allocations);
        const isSelected = selectedSliceId === slice.id;

        let fill = colors.empty;
        if (fillRatio > 0) fill = fillRatio >= 1 ? colors.solid : colors.filled;

        return (
          <path
            key={slice.id}
            d={sliceArcPath(slice, CENTER, CENTER)}
            fill={fill}
            stroke={isSelected ? 'var(--color-text)' : '#0b0805'}
            strokeWidth={isSelected ? 2.5 : 1.5}
            opacity={unlocked ? 1 : 0.35}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectSlice(slice.id)}
          >
            <title>{`${alloc?.points ?? 0}/${maxPoints} pontos`}</title>
          </path>
        );
      })}

      {WHEEL_SLICE_GEOMETRY.map((slice) => {
        const domain = slice.domain as WheelDomainId;
        const [cx, cy] = sliceCenterXY(slice, CENTER, CENTER);
        const visual = resolveSliceConviction(vocation, slice.id, domain);
        const dedication = resolveSliceDedication(domain, slice.ring);
        const size = slice.ring === 4 ? ICON_SIZE + 8 : ICON_SIZE;
        const badgeR = size / 2 + 4;
        const dedR = badgeR * 0.55;
        const dedCx = cx - badgeR * 0.8;
        const dedCy = cy + badgeR * 0.8;
        const dedSize = dedR * 1.5;
        return (
          <g key={`icon-${slice.id}`} style={{ pointerEvents: 'none' }}>
            <circle cx={cx} cy={cy} r={badgeR} fill="#15100a" stroke={WHEEL_DOMAIN_COLORS[domain].solid} strokeWidth={1.5} />
            {visual.iconUrl ? (
              <image href={visual.iconUrl} x={cx - size / 2} y={cy - size / 2} width={size} height={size} style={{ imageRendering: 'pixelated' }} clipPath={`circle(${size / 2}px at ${size / 2}px ${size / 2}px)`} />
            ) : (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.6} style={{ userSelect: 'none' }}>
                {visual.emoji}
              </text>
            )}
            <circle cx={dedCx} cy={dedCy} r={dedR} fill="#0b0805" stroke="url(#wheelGold)" strokeWidth={1.2} />
            {dedication.iconUrl ? (
              <image href={dedication.iconUrl} x={dedCx - dedSize / 2} y={dedCy - dedSize / 2} width={dedSize} height={dedSize} style={{ imageRendering: 'pixelated' }} clipPath={`circle(${dedR}px at ${dedSize / 2}px ${dedSize / 2}px)`} />
            ) : (
              <text x={dedCx} y={dedCy} textAnchor="middle" dominantBaseline="middle" fontSize={dedR} style={{ userSelect: 'none' }}>
                {dedication.icon}
              </text>
            )}
          </g>
        );
      })}

      <circle cx={CENTER} cy={CENTER} r={12} fill="var(--color-bg-elevated)" stroke="url(#wheelGold)" strokeWidth={2} />

      {([0, 1, 2, 3] as WheelDomainId[]).map((domain) => {
        const pos = DOMAIN_CORNER[domain];
        const perk = VOCATION_REVELATION_PERKS[vocation][domain];
        const stage = domainRevelationStage(domain, allocations);
        const iconUrl = getWheelIconUrl(perk.id);
        const pseudoId = `revelation:${domain}`;
        const isSelected = selectedSliceId === pseudoId;
        const solid = WHEEL_DOMAIN_COLORS[domain].solid;
        return (
          <g key={pseudoId} style={{ cursor: 'pointer' }} onClick={() => onSelectSlice(pseudoId)}>
            <circle cx={pos.x} cy={pos.y} r={MEDALLION_R + 5} fill="none" stroke="url(#wheelGold)" strokeWidth={2} />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const studR = MEDALLION_R + 10;
              return <circle key={`stud-${i}`} cx={pos.x + studR * Math.cos(a)} cy={pos.y + studR * Math.sin(a)} r={2.5} fill="url(#wheelGold)" />;
            })}
            <circle cx={pos.x} cy={pos.y} r={MEDALLION_R} fill="#15100a" stroke={solid} strokeWidth={isSelected ? 3.5 : 2.5} opacity={stage > 0 ? 1 : 0.55} />
            {iconUrl && (
              <image
                href={iconUrl}
                x={pos.x - MEDALLION_R + 8}
                y={pos.y - MEDALLION_R + 8}
                width={(MEDALLION_R - 8) * 2}
                height={(MEDALLION_R - 8) * 2}
                style={{ imageRendering: 'pixelated', opacity: stage > 0 ? 1 : 0.4 }}
              />
            )}
            {stage === 0 && (
              <text x={pos.x} y={pos.y + 2} textAnchor="middle" dominantBaseline="middle" fontSize={20}>🔒</text>
            )}
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={pos.x - 12 + i * 12}
                cy={pos.y + MEDALLION_R + 12}
                r={4}
                fill={stage > i ? solid : '#15100a'}
                stroke="url(#wheelGold)"
                strokeWidth={1}
              />
            ))}
            <title>{`${perk.name} — estágio ${stage}/3`}</title>
          </g>
        );
      })}
    </svg>
  );
}
