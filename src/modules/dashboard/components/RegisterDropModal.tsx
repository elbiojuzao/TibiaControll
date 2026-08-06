import { useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { BOSS_NAMES, BOSS_ITEMS } from '@/services/lootdrop/boss-items-data';
import { VOCATION_ICON } from '@/services/vocation/vocation-display';
import { isoToBr, brToIso, todayAsBr } from '@/services/common/br-date';
import type { CreateLootDropDto, Member, Serviceiro, Vocation } from '@/types';

const VAZIO = '';

interface RegisterDropModalProps {
  members: Member[];
  serviceiros: Serviceiro[];
  onClose: () => void;
  onSubmit: (dto: CreateLootDropDto) => Promise<unknown>;
}

export function RegisterDropModal({ members, serviceiros, onClose, onSubmit }: RegisterDropModalProps) {
  const byVocation = (v: Vocation) => members.find((m) => m.vocation === v)?.characterName ?? '';

  const [date, setDate] = useState(todayAsBr());
  const [ek, setEk] = useState(byVocation('EK'));
  const [ed, setEd] = useState(byVocation('ED'));
  const [rp, setRp] = useState(byVocation('RP'));
  const [ms, setMs] = useState(byVocation('MS'));
  const [fifthPlayer, setFifthPlayer] = useState('');
  const [serviceiroId, setServiceiroId] = useState(VAZIO);
  const [serviceiroVocation, setServiceiroVocation] = useState<Vocation | ''>(VAZIO);
  const [unitValue, setUnitValue] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [bossName, setBossName] = useState(VAZIO);
  const [itemName, setItemName] = useState(VAZIO);
  const [looter, setLooter] = useState(VAZIO);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedServiceiro = serviceiros.find((s) => s.id === serviceiroId);
  const itemOptions = bossName ? BOSS_ITEMS[bossName] ?? [] : [];

  const looterOptions = useMemo(() => {
    const options = [ek, ed, rp, ms, fifthPlayer, selectedServiceiro?.name].filter((n): n is string => !!n);
    return Array.from(new Set(options));
  }, [ek, ed, rp, ms, fifthPlayer, selectedServiceiro]);

  const handleBossChange = (value: string) => {
    setBossName(value);
    setItemName(VAZIO);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const unit = Number(unitValue);
    const total = Number(totalValue);

    if (!bossName) return setFormError('Selecione o boss.');
    if (!itemName) return setFormError('Selecione o item.');
    if (!looter) return setFormError('Selecione o fragador.');
    if (!totalValue || Number.isNaN(total) || total <= 0) return setFormError('Informe o Valor Total.');
    if (!unitValue || Number.isNaN(unit) || unit <= 0) return setFormError('Informe o Valor Cada.');

    setSaving(true);
    try {
      await onSubmit({
        date,
        party: {
          ek: ek || undefined,
          ed: ed || undefined,
          rp: rp || undefined,
          ms: ms || undefined,
          fifthPlayer: fifthPlayer || undefined,
          serviceiroId: serviceiroId || undefined,
          serviceiroVocation: serviceiroVocation || undefined,
        },
        unitValue: unit,
        totalValue: total,
        looter,
        itemName,
        bossName,
        sold: false,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff',
    border: '1px solid #334155', borderRadius: '6px', padding: '8px', boxSizing: 'border-box', fontSize: '13px',
  };
  const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#94a3b8' };

  return (
    <Modal title="Registro de Venda de Drop" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <label style={labelStyle}>
          Data:
          <input type="date" value={brToIso(date)} onChange={(e) => setDate(isoToBr(e.target.value))} style={fieldStyle} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={labelStyle}>
            EK:
            <select value={ek} onChange={(e) => setEk(e.target.value)} style={fieldStyle}>
              <option value={VAZIO}>-- Vazio --</option>
              {members.filter((m) => m.vocation === 'EK').map((m) => (
                <option key={m.id} value={m.characterName}>{m.characterName}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            ED:
            <select value={ed} onChange={(e) => setEd(e.target.value)} style={fieldStyle}>
              <option value={VAZIO}>-- Vazio --</option>
              {members.filter((m) => m.vocation === 'ED').map((m) => (
                <option key={m.id} value={m.characterName}>{m.characterName}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            RP:
            <select value={rp} onChange={(e) => setRp(e.target.value)} style={fieldStyle}>
              <option value={VAZIO}>-- Vazio --</option>
              {members.filter((m) => m.vocation === 'RP').map((m) => (
                <option key={m.id} value={m.characterName}>{m.characterName}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            MS:
            <select value={ms} onChange={(e) => setMs(e.target.value)} style={fieldStyle}>
              <option value={VAZIO}>-- Vazio --</option>
              {members.filter((m) => m.vocation === 'MS').map((m) => (
                <option key={m.id} value={m.characterName}>{m.characterName}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={labelStyle}>
            5º Player:
            <input type="text" value={fifthPlayer} onChange={(e) => setFifthPlayer(e.target.value)} placeholder="Nome do char" style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            Serviceiro:
            <select
              value={serviceiroId}
              onChange={(e) => { setServiceiroId(e.target.value); setServiceiroVocation(VAZIO); }}
              style={fieldStyle}
            >
              <option value={VAZIO}>-- Vazio --</option>
              {serviceiros.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>

        {selectedServiceiro && (
          <label style={labelStyle}>
            Service em:
            <select value={serviceiroVocation} onChange={(e) => setServiceiroVocation(e.target.value as Vocation)} style={fieldStyle}>
              <option value={VAZIO}>-- Vazio --</option>
              {selectedServiceiro.vocations.map((v) => (
                <option key={v} value={v}>{VOCATION_ICON[v]} {v}</option>
              ))}
            </select>
          </label>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={labelStyle}>
            Valor Total:
            <input type="number" min={0} value={totalValue} onChange={(e) => setTotalValue(e.target.value)} placeholder="0" style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            Valor Cada:
            <input type="number" min={0} value={unitValue} onChange={(e) => setUnitValue(e.target.value)} placeholder="0" style={fieldStyle} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={labelStyle}>
            Boss:
            <select value={bossName} onChange={(e) => handleBossChange(e.target.value)} style={fieldStyle}>
              <option value={VAZIO}>-- Vazio --</option>
              {BOSS_NAMES.map((boss) => (
                <option key={boss} value={boss}>{boss}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Item:
            <select value={itemName} onChange={(e) => setItemName(e.target.value)} disabled={!bossName} style={fieldStyle}>
              <option value={VAZIO}>{bossName ? '-- Vazio --' : 'Escolha o boss primeiro'}</option>
              {itemOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <label style={labelStyle}>
          Fragador:
          <select value={looter} onChange={(e) => setLooter(e.target.value)} style={fieldStyle}>
            <option value={VAZIO}>-- Vazio --</option>
            {looterOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>

        {formError && <span style={{ color: '#ef4444', fontSize: '12px' }}>{formError}</span>}

        <button
          type="submit"
          disabled={saving}
          style={{
            background: '#38bdf8', color: '#0f172a', border: 'none', padding: '12px',
            borderRadius: '8px', fontWeight: 'bold', cursor: saving ? 'default' : 'pointer',
            fontSize: '14px', opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Registrando...' : 'Registrar Venda'}
        </button>
      </form>
    </Modal>
  );
}
