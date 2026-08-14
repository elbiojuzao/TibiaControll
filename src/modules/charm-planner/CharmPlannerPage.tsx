import { useMemo, useState } from 'react';
import { calculateCharmPlan, MAJOR_CHARMS, MINOR_CHARMS, getCharmIconUrl } from '@/services/charm';
import type { CharmLevel } from '@/types';

function formatPoints(value: number): string {
  return value.toLocaleString('pt-BR');
}

/** Bronze -> Prata -> Ouro -> desbloqueia de novo (cíclico) — pedido do usuário: 1 clique
 * na runa avança pro próximo nível, não precisa de 3 alvos separados. */
function cycleLevel(current: CharmLevel): CharmLevel {
  return ((current + 1) % 4) as CharmLevel;
}

const LEVEL_BORDER: Record<CharmLevel, string> = {
  0: '#334155',
  1: '#cd7f32', // bronze
  2: '#cbd5e1', // prata
  3: '#fbbf24', // ouro
};

const LEVEL_GLOW: Record<CharmLevel, string> = {
  0: 'none',
  1: '0 0 8px rgba(205, 127, 50, 0.55)',
  2: '0 0 8px rgba(203, 213, 225, 0.6)',
  3: '0 0 10px rgba(251, 191, 36, 0.7)',
};

const LEVEL_LABEL: Record<CharmLevel, string> = {
  0: 'Bloqueado',
  1: 'Bronze',
  2: 'Prata',
  3: 'Ouro',
};

interface CharmRuneProps {
  charmId: string;
  name: string;
  level: CharmLevel;
  cost: number;
  onClick: () => void;
}

function CharmRune({ charmId, name, level, cost, onClick }: CharmRuneProps) {
  const iconUrl = getCharmIconUrl(charmId);

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${name} — ${LEVEL_LABEL[level]} (clique pra avançar)`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '10px 6px',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      {/* Badge textual redundante com a cor do anel — pra quem tem dificuldade de
          distinguir bronze/prata/ouro só pela cor (pedido do usuário, 2026-08-14). */}
      {level > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            fontSize: '9px',
            fontWeight: 'bold',
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: '4px',
            background: LEVEL_BORDER[level],
            color: '#0f172a',
          }}
        >
          Nv{level}
        </span>
      )}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: `3px solid ${LEVEL_BORDER[level]}`,
          boxShadow: LEVEL_GLOW[level],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1e293b',
          opacity: level === 0 ? 0.55 : 1,
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
        }}
      >
        {iconUrl ? (
          <img src={iconUrl} alt={name} width={32} height={32} style={{ imageRendering: 'pixelated' }} />
        ) : (
          <span style={{ fontSize: '10px', color: '#64748b' }}>?</span>
        )}
      </div>
      <span style={{ fontSize: '11px', color: '#e2e8f0', textAlign: 'center', lineHeight: 1.2 }}>{name}</span>
      <span style={{ fontSize: '10px', fontWeight: 'bold', color: level > 0 ? LEVEL_BORDER[level] : '#64748b' }}>
        {level > 0 ? formatPoints(cost) : '—'}
      </span>
    </button>
  );
}

interface CharmSectionProps {
  title: string;
  accentColor: string;
  charms: typeof MAJOR_CHARMS;
  selections: Record<string, CharmLevel>;
  onRuneClick: (charmId: string) => void;
  rows: { charmId: string; cost: number }[];
  available: number;
  onAvailableChange: (value: number) => void;
  required: number;
  remaining: number;
  unitLabel: string;
}

function CharmSection({
  title,
  accentColor,
  charms,
  selections,
  onRuneClick,
  rows,
  available,
  onAvailableChange,
  required,
  remaining,
  unitLabel,
}: CharmSectionProps) {
  const costByCharm = Object.fromEntries(rows.map((r) => [r.charmId, r.cost]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '10px 15px', background: accentColor, color: '#0f172a', fontWeight: 'bold', fontSize: '13px' }}>
          {title}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
            gap: '8px',
            padding: '12px',
          }}
        >
          {charms.map((charm) => {
            const level = selections[charm.id] ?? 0;
            return (
              <CharmRune
                key={charm.id}
                charmId={charm.id}
                name={charm.name}
                level={level}
                cost={costByCharm[charm.id] ?? 0}
                onClick={() => onRuneClick(charm.id)}
              />
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{unitLabel} disponíveis</span>
          <input
            type="number"
            min={0}
            value={available}
            onChange={(e) => onAvailableChange(Number(e.target.value) || 0)}
            style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '6px', textAlign: 'center', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Necessários</span>
          <strong style={{ fontSize: '15px', color: '#38bdf8' }}>{formatPoints(required)}</strong>
        </div>
        <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Sobrando</span>
          <strong style={{ fontSize: '15px', color: remaining < 0 ? '#ef4444' : '#10b981' }}>{formatPoints(remaining)}</strong>
        </div>
      </div>
    </div>
  );
}

export function CharmPlannerPage() {
  const [selections, setSelections] = useState<Record<string, CharmLevel>>({});
  const [availableMajorPoints, setAvailableMajorPoints] = useState(0);
  const [availableMinorEchoes, setAvailableMinorEchoes] = useState(0);

  const handleRuneClick = (charmId: string) => {
    setSelections((prev) => ({ ...prev, [charmId]: cycleLevel(prev[charmId] ?? 0) }));
  };

  const result = useMemo(
    () => calculateCharmPlan({ selections, availableMajorPoints, availableMinorEchoes }),
    [selections, availableMajorPoints, availableMinorEchoes],
  );

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1500px', margin: '0 auto', color: '#f8fafc' }}>
      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#10b981' }}>Charm Planner</h2>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
          Clique na runa pra avançar de nível (Bronze → Prata → Ouro → desbloqueia de novo) e veja quanto de Charm
          Points / Minor Charm Echoes você precisa e quanto sobra do que já tem.
        </p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: `2px solid ${LEVEL_BORDER[1]}`, display: 'inline-block' }} /> Bronze
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: `2px solid ${LEVEL_BORDER[2]}`, display: 'inline-block' }} /> Prata
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: `2px solid ${LEVEL_BORDER[3]}`, display: 'inline-block' }} /> Ouro
          </span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        <CharmSection
          title="MAJOR CHARMS"
          accentColor="#f59e0b"
          charms={MAJOR_CHARMS}
          selections={selections}
          onRuneClick={handleRuneClick}
          rows={result.major.rows}
          available={availableMajorPoints}
          onAvailableChange={setAvailableMajorPoints}
          required={result.major.required}
          remaining={result.major.remaining}
          unitLabel="Charm Points"
        />
        <CharmSection
          title="MINOR CHARMS"
          accentColor="#38bdf8"
          charms={MINOR_CHARMS}
          selections={selections}
          onRuneClick={handleRuneClick}
          rows={result.minor.rows}
          available={availableMinorEchoes}
          onAvailableChange={setAvailableMinorEchoes}
          required={result.minor.required}
          remaining={result.minor.remaining}
          unitLabel="Minor Charm Echoes"
        />
      </div>
    </div>
  );
}
