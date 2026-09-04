import { WHEEL_SLICE_GEOMETRY } from '@/services/wheel/wheel-geometry';
import { ringPointCap, resolveSliceConviction, resolveSliceDedication, WHEEL_DOMAIN_LABEL } from '@/services/wheel/wheel-slice-content';
import { isSliceUnlocked, domainRevelationStage, domainTotalPoints, type AllocationMap } from '@/services/wheel/wheel-logic';
import { VOCATION_REVELATION_PERKS, REVELATION_STAGE_THRESHOLDS } from '@/services/wheel/wheel-perks-data';
import { getWheelIconUrl } from '@/services/wheel/wheel-icons';
import type { WheelDomainId, WheelSliceAllocation, WheelVocation } from '@/types';

interface SliceDetailPanelProps {
  vocation: WheelVocation;
  sliceId: string;
  allocations: AllocationMap;
  onChange: (sliceId: string, allocation: WheelSliceAllocation) => void;
}

const STEP = 5;

/** Painel de detalhe — mostra ou (a) o Dedication Perk + Conviction Perk FIXOS de uma fatia
 * normal, com stepper de pontos (0 até o teto real do anel: 50/75/100/150/200), ou (b) o
 * Revelation Perk de um domínio, quando o clique veio de um medalhão de canto da roda
 * (sliceId no formato `revelation:{domain}`, ver WheelDiagram.tsx — os 4 Revelation Perks
 * viraram medalhões integrados na roda em 2026-09-03, print real do jogo como referência). */
export function SliceDetailPanel({ vocation, sliceId, allocations, onChange }: SliceDetailPanelProps) {
  if (sliceId.startsWith('revelation:')) {
    const domain = Number(sliceId.split(':')[1]) as WheelDomainId;
    const perk = VOCATION_REVELATION_PERKS[vocation][domain];
    const total = domainTotalPoints(domain, allocations);
    const stage = domainRevelationStage(domain, allocations);
    const iconUrl = getWheelIconUrl(perk.id);
    return (
      <div className="card-compacto" style={{ padding: '14px' }}>
        <span className="label-padrao" style={{ display: 'block', marginBottom: '4px' }}>
          Revelation Perk — Domínio {WHEEL_DOMAIN_LABEL[domain]}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          {iconUrl && <img src={iconUrl} alt="" className="h32 w32" style={{ imageRendering: 'pixelated' }} />}
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--color-accent)' }}>{perk.name}</div>
            <div className="texto-fraco" style={{ fontSize: '11px' }}>{total}/{REVELATION_STAGE_THRESHOLDS.stage3} pts no domínio</div>
          </div>
        </div>
        <p className="texto-mudo" style={{ fontSize: '12px', margin: '6px 0 10px' }}>{perk.description}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
          <span className={stage >= 1 ? 'texto-sucesso' : 'texto-fraco'}>{stage >= 1 ? '✓' : '○'} Estágio 1 ({REVELATION_STAGE_THRESHOLDS.stage1} pts): {perk.stage1}</span>
          <span className={stage >= 2 ? 'texto-sucesso' : 'texto-fraco'}>{stage >= 2 ? '✓' : '○'} Estágio 2 ({REVELATION_STAGE_THRESHOLDS.stage2} pts): {perk.stage2}</span>
          <span className={stage >= 3 ? 'texto-sucesso' : 'texto-fraco'}>{stage >= 3 ? '✓' : '○'} Estágio 3 ({REVELATION_STAGE_THRESHOLDS.stage3} pts): {perk.stage3}</span>
        </div>
      </div>
    );
  }

  const slice = WHEEL_SLICE_GEOMETRY.find((s) => s.id === sliceId);
  if (!slice) return null;

  const domain = slice.domain as WheelDomainId;
  const alloc = allocations[sliceId] ?? { sliceId, points: 0 };
  const unlocked = isSliceUnlocked(sliceId, allocations);
  const maxPoints = ringPointCap(slice.ring);

  const dedication = resolveSliceDedication(domain, slice.ring);
  const conviction = resolveSliceConviction(vocation, sliceId, domain);

  const setPoints = (points: number) => {
    onChange(sliceId, { sliceId, points: Math.max(0, Math.min(maxPoints, points)) });
  };

  return (
    <div className="card-compacto" style={{ padding: '14px', opacity: unlocked ? 1 : 0.6 }}>
      <span className="label-padrao" style={{ display: 'block', marginBottom: '10px' }}>
        Domínio {WHEEL_DOMAIN_LABEL[domain]} — Anel {slice.ring}
      </span>

      {!unlocked && (
        <p className="texto-perigo" style={{ fontSize: '12px', margin: '0 0 10px' }}>
          🔒 Preencha o anel anterior deste domínio por completo pra desbloquear esta fatia.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        <div>
          <span className="texto-fraco" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Dedication Perk</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            {dedication.iconUrl ? (
              <img src={dedication.iconUrl} alt="" className="h32 w32" style={{ imageRendering: 'pixelated', flexShrink: 0 }} />
            ) : (
              <span style={{ fontSize: '22px' }}>{dedication.icon}</span>
            )}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{dedication.name}</div>
              <div className="texto-mudo" style={{ fontSize: '11px' }}>{dedication.description}</div>
            </div>
          </div>
        </div>

        <div>
          <span className="texto-fraco" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Conviction Perk</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            {conviction.iconUrl ? (
              <img src={conviction.iconUrl} alt="" className="h32 w32" style={{ imageRendering: 'pixelated', flexShrink: 0 }} />
            ) : (
              <span style={{ fontSize: '22px' }}>{conviction.emoji}</span>
            )}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-accent)' }}>{conviction.name}</div>
              <div className="texto-mudo" style={{ fontSize: '11px' }}>{conviction.description}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button type="button" className="botao-secundario" disabled={!unlocked || alloc.points <= 0} onClick={() => setPoints(alloc.points - STEP)}>-</button>
        <span style={{ minWidth: '80px', textAlign: 'center', fontWeight: 'bold' }}>{alloc.points} / {maxPoints}</span>
        <button type="button" className="botao-secundario" disabled={!unlocked || alloc.points >= maxPoints} onClick={() => setPoints(alloc.points + STEP)}>+</button>
        <button type="button" className="botao-secundario" disabled={!unlocked || alloc.points >= maxPoints} onClick={() => setPoints(maxPoints)} style={{ marginLeft: 'auto' }}>Máx</button>
      </div>
    </div>
  );
}
