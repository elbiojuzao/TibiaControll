import { useMemo, useState } from 'react';
import { calculateCharmPlan, MAJOR_CHARMS, MINOR_CHARMS } from '@/services/charm';
import type { CharmLevel } from '@/types';

function formatPoints(value: number): string {
  return value.toLocaleString('pt-BR');
}

interface CharmSectionProps {
  title: string;
  accentColor: string;
  charms: typeof MAJOR_CHARMS;
  selections: Record<string, CharmLevel>;
  onLevelClick: (charmId: string, level: CharmLevel) => void;
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
  onLevelClick,
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Charm</th>
                <th style={{ padding: '6px' }}>Nível 1</th>
                <th style={{ padding: '6px' }}>Nível 2</th>
                <th style={{ padding: '6px' }}>Nível 3</th>
                <th style={{ textAlign: 'right', padding: '6px 10px' }}>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {charms.map((charm) => {
                const level = selections[charm.id] ?? 0;
                return (
                  <tr key={charm.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '6px 10px', color: '#f8fafc', fontWeight: 'bold' }}>{charm.name}</td>
                    {([1, 2, 3] as CharmLevel[]).map((lvl) => (
                      <td key={lvl} style={{ textAlign: 'center', padding: '4px' }}>
                        <input
                          type="checkbox"
                          checked={level === lvl}
                          onChange={() => onLevelClick(charm.id, level === lvl ? 0 : lvl)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor }}
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', padding: '6px 10px', color: level > 0 ? '#10b981' : '#64748b', fontWeight: 'bold' }}>
                      {formatPoints(costByCharm[charm.id] ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

  const handleLevelClick = (charmId: string, level: CharmLevel) => {
    setSelections((prev) => ({ ...prev, [charmId]: level }));
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
          Escolha o nível alvo de cada Major e Minor Charm e veja quanto de Charm Points / Minor Charm Echoes você
          precisa e quanto sobra do que já tem.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        <CharmSection
          title="MAJOR CHARMS"
          accentColor="#f59e0b"
          charms={MAJOR_CHARMS}
          selections={selections}
          onLevelClick={handleLevelClick}
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
          onLevelClick={handleLevelClick}
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
