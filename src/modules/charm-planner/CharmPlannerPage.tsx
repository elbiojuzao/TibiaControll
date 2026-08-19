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
  0: 'var(--color-border)',
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
        background: 'var(--color-bg-input)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
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
            borderRadius: 'var(--radius-sm)',
            background: LEVEL_BORDER[level],
            color: 'var(--color-bg)',
          }}
        >
          Nv{level}
        </span>
      )}
      <div
        className="h44 w44"
        style={{
          borderRadius: 'var(--radius-pill)',
          border: `3px solid ${LEVEL_BORDER[level]}`,
          boxShadow: LEVEL_GLOW[level],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-elevated)',
          opacity: level === 0 ? 0.55 : 1,
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
        }}
      >
        {iconUrl ? (
          <img src={iconUrl} alt={name} className="h32 w32" style={{ imageRendering: 'pixelated' }} />
        ) : (
          <span className="texto-fraco" style={{ fontSize: '10px' }}>?</span>
        )}
      </div>
      <span className="texto-mudo" style={{ fontSize: '11px', textAlign: 'center', lineHeight: 1.2 }}>{name}</span>
      <span style={{ fontSize: '10px', fontWeight: 'bold', color: level > 0 ? LEVEL_BORDER[level] : 'var(--color-text-faint)' }}>
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
    <div className="form-coluna">
      <div className="card-compacto" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 15px', background: accentColor, color: 'var(--color-bg)', fontWeight: 'bold', fontSize: '13px' }}>
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

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div className="stat-box" style={{ padding: '10px', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>{unitLabel} disponíveis</span>
          <input
            type="number"
            min={0}
            value={available}
            onChange={(e) => onAvailableChange(Number(e.target.value) || 0)}
            style={{ width: '100%', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px', textAlign: 'center', boxSizing: 'border-box' }}
          />
        </div>
        <div className="stat-box" style={{ padding: '10px', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Necessários</span>
          <strong style={{ fontSize: '15px', color: 'var(--color-accent)' }}>{formatPoints(required)}</strong>
        </div>
        <div className="stat-box" style={{ padding: '10px', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Sobrando</span>
          <strong style={{ fontSize: '15px', color: remaining < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatPoints(remaining)}</strong>
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
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1500px', margin: '0 auto', color: 'var(--color-text)' }}>
      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-accent)' }}>Charm Planner</h2>
        <p className="subtitulo-pagina">
          Clique na runa pra avançar de nível (Bronze → Prata → Ouro → desbloqueia de novo) e veja quanto de Charm
          Points / Minor Charm Echoes você precisa e quanto sobra do que já tem.
        </p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="h12 w12" style={{ borderRadius: 'var(--radius-pill)', border: `2px solid ${LEVEL_BORDER[1]}`, display: 'inline-block' }} /> Bronze
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="h12 w12" style={{ borderRadius: 'var(--radius-pill)', border: `2px solid ${LEVEL_BORDER[2]}`, display: 'inline-block' }} /> Prata
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="h12 w12" style={{ borderRadius: 'var(--radius-pill)', border: `2px solid ${LEVEL_BORDER[3]}`, display: 'inline-block' }} /> Ouro
          </span>
        </div>
      </header>

      <div className="grid-2col" style={{ gap: '20px', alignItems: 'start' }}>
        <CharmSection
          title="MAJOR CHARMS"
          accentColor="var(--color-warning)"
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
          accentColor="var(--color-accent)"
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
