import { useState } from 'react';
import { WHEEL_DOMAIN_LABEL } from '@/services/wheel/wheel-slice-content';
import { GEM_ATELIER_COSTS, GEM_ATELIER_LIMITS, GEM_MOD_SLOTS, GEM_SIZE_LABEL, GEM_VESSEL_DAMAGE_HEALING_BONUS, MOD_GRADE_SCALE, FRAGMENT_WORKSHOP_UPGRADE_COST } from '@/services/wheel/gem-atelier-data';
import type { GemSize, WheelDomainId, WheelGem, WheelGemVessel } from '@/types';

interface GemAtelierPanelProps {
  vessels: WheelGemVessel[];
  gems: WheelGem[];
  onChangeVessels: (vessels: WheelGemVessel[]) => void;
  onChangeGems: (gems: WheelGem[]) => void;
}

function formatGold(v: number): string {
  return v.toLocaleString('pt-BR');
}

const DOMAINS: WheelDomainId[] = [0, 1, 2, 3];
const GEM_SIZES: GemSize[] = ['lesser', 'regular', 'greater'];

/** Ateliê de Gemas — mecânica real (custos/limites de GEM_ATELIER_COSTS, ver
 * gem-atelier-data.ts), simplificado pra gerenciar Vessel Resonances por domínio (0-3) e uma
 * lista de gems (revelar/girar afinidade/subir grau de mod), sem tentar reproduzir o
 * catálogo exaustivo de centenas de mods específicos do jogo — cada mod mostra a escala de
 * valor genérica (MOD_GRADE_SCALE) real extraída dos dados públicos do tibiapal. */
export function GemAtelierPanel({ vessels, gems, onChangeVessels, onChangeGems }: GemAtelierPanelProps) {
  const [newGemSize, setNewGemSize] = useState<GemSize>('lesser');
  const [newGemDomain, setNewGemDomain] = useState<WheelDomainId>(0);

  const vesselFor = (domain: WheelDomainId) => vessels.find((v) => v.domain === domain)?.enabledCount ?? 0;

  const setVessel = (domain: WheelDomainId, count: number) => {
    const clamped = Math.max(0, Math.min(GEM_ATELIER_LIMITS.maxVesselsPerDomain, count));
    const next = vessels.filter((v) => v.domain !== domain);
    next.push({ domain, enabledCount: clamped });
    onChangeVessels(next);
  };

  const addGem = () => {
    const gem: WheelGem = { id: crypto.randomUUID(), size: newGemSize, domain: newGemDomain, revealed: false, modGrades: [] };
    onChangeGems([gem, ...gems]);
  };

  const removeGem = (id: string) => {
    if (!window.confirm('Remover este gem da lista? Essa ação não pode ser desfeita.')) return;
    onChangeGems(gems.filter((g) => g.id !== id));
  };

  const revealGem = (id: string) => {
    onChangeGems(gems.map((g) => (g.id === id ? { ...g, revealed: true, modGrades: Array(GEM_MOD_SLOTS[g.size]).fill(0) } : g)));
  };

  const rotateAffinity = (id: string) => {
    onChangeGems(gems.map((g) => (g.id === id ? { ...g, domain: ((g.domain + 1) % 4) as WheelDomainId } : g)));
  };

  const upgradeModGrade = (id: string, modIndex: number) => {
    onChangeGems(gems.map((g) => {
      if (g.id !== id) return g;
      const grades = [...g.modGrades];
      grades[modIndex] = Math.min(3, grades[modIndex] + 1);
      return { ...g, modGrades: grades };
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="card-compacto" style={{ padding: '14px' }}>
        <span className="label-padrao" style={{ display: 'block', marginBottom: '8px' }}>Vessel Resonance por domínio</span>
        <p className="texto-mudo" style={{ fontSize: '12px', margin: '0 0 10px' }}>
          Precisa bater com o nº de mod slots do gem socketado ali pra ele dar bônus completo — Lesser +{GEM_VESSEL_DAMAGE_HEALING_BONUS.lesser}, Regular +{GEM_VESSEL_DAMAGE_HEALING_BONUS.regular}, Greater +{GEM_VESSEL_DAMAGE_HEALING_BONUS.greater} de dano/cura quando o nº de vessels bate com os slots do gem.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {DOMAINS.map((d) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', minWidth: '70px' }}>{WHEEL_DOMAIN_LABEL[d]}</span>
              <button type="button" className="botao-secundario" disabled={vesselFor(d) <= 0} onClick={() => setVessel(d, vesselFor(d) - 1)}>-</button>
              <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{vesselFor(d)}</span>
              <button type="button" className="botao-secundario" disabled={vesselFor(d) >= 3} onClick={() => setVessel(d, vesselFor(d) + 1)}>+</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card-compacto" style={{ padding: '14px' }}>
        <span className="label-padrao" style={{ display: 'block', marginBottom: '8px' }}>Meus Gems ({gems.length}/{GEM_ATELIER_LIMITS.maxRevealedGems})</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <select value={newGemSize} onChange={(e) => setNewGemSize(e.target.value as GemSize)} className="campo-input" style={{ width: 'auto' }}>
            {GEM_SIZES.map((s) => <option key={s} value={s}>{GEM_SIZE_LABEL[s]}</option>)}
          </select>
          <select value={newGemDomain} onChange={(e) => setNewGemDomain(Number(e.target.value) as WheelDomainId)} className="campo-input" style={{ width: 'auto' }}>
            {DOMAINS.map((d) => <option key={d} value={d}>{WHEEL_DOMAIN_LABEL[d]}</option>)}
          </select>
          <button type="button" onClick={addGem} className="botao-primario">+ Adicionar Gem</button>
        </div>

        {gems.length === 0 && <p className="estado-vazio">Nenhum gem cadastrado ainda.</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {gems.map((gem) => (
            <div key={gem.id} className="card-compacto" style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>{GEM_SIZE_LABEL[gem.size]}</strong>
                  <span className="texto-fraco" style={{ fontSize: '11px', marginLeft: '8px' }}>Afinidade: {WHEEL_DOMAIN_LABEL[gem.domain]}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {!gem.revealed && (
                    <button type="button" onClick={() => revealGem(gem.id)} className="botao-secundario" style={{ fontSize: '11px' }}>
                      Revelar ({formatGold(GEM_ATELIER_COSTS[gem.size].revealMods)} gold)
                    </button>
                  )}
                  <button type="button" onClick={() => rotateAffinity(gem.id)} className="botao-secundario" style={{ fontSize: '11px' }}>
                    Girar afinidade ({formatGold(GEM_ATELIER_COSTS[gem.size].rotateAffinity)} gold)
                  </button>
                  <button type="button" onClick={() => removeGem(gem.id)} title="Remover gem" className="botao-icone-perigo">🗑️</button>
                </div>
              </div>

              {gem.revealed && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {gem.modGrades.map((grade, idx) => (
                    <div key={idx} style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '11px' }}>
                      <div>Mod {idx + 1} — Grau {['I', 'II', 'III', 'IV'][grade]} ({MOD_GRADE_SCALE[grade]})</div>
                      {grade < 3 && (
                        <button
                          type="button"
                          onClick={() => upgradeModGrade(gem.id, idx)}
                          className="botao-secundario"
                          style={{ fontSize: '10px', marginTop: '4px' }}
                        >
                          Subir pra Grau {['II', 'III', 'IV'][grade]} ({FRAGMENT_WORKSHOP_UPGRADE_COST[grade].fragments} frag. + {formatGold(idx === gem.modGrades.length - 1 && gem.size === 'greater' ? FRAGMENT_WORKSHOP_UPGRADE_COST[grade].goldSupremeMod : FRAGMENT_WORKSHOP_UPGRADE_COST[grade].goldBasicMod)} gold)
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
