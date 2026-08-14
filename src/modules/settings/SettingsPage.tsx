import { useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useMembers } from '@/hooks/useMembers';
import { VOCATION_ICON, VOCATION_LABEL } from '@/services/vocation/vocation-display';
import { SKILL_CATEGORY_LABEL } from '@/services/tibiadata/tibiadata-client';
import type { HighscoreSkillCategory, Vocation } from '@/types';

const VOCATIONS: Vocation[] = ['EK', 'ED', 'MS', 'RP', 'EM', 'OTHER'];
/** Só EK é ambíguo (pode treinar Axe/Sword/Club) — outras vocações inferem a categoria
 * certa sozinhas, ver resolveSkillCategory() em tibiadata-client.ts. */
const EK_SKILL_OPTIONS: HighscoreSkillCategory[] = ['axefighting', 'swordfighting', 'clubfighting'];

export function SettingsPage() {
  const { accountId } = useAccount();
  const { members, loading, error, createMember, updateMember, removeMember } = useMembers(accountId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCharacterName, setFormCharacterName] = useState('');
  const [formVocation, setFormVocation] = useState<Vocation>('EK');
  const [formSkillCategory, setFormSkillCategory] = useState<HighscoreSkillCategory>('axefighting');
  const [formIsServiceiro, setFormIsServiceiro] = useState(false);
  const [formSharePercent, setFormSharePercent] = useState('');
  const [formOwnerCharacterName, setFormOwnerCharacterName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormCharacterName('');
    setFormVocation('EK');
    setFormSkillCategory('axefighting');
    setFormIsServiceiro(false);
    setFormSharePercent('');
    setFormOwnerCharacterName('');
    setFormError(null);
  };

  const startCreate = () => {
    if (showForm && !editingId) {
      resetForm();
      return;
    }
    resetForm();
    setShowForm(true);
  };

  const startEdit = (id: string) => {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    setEditingId(id);
    setFormCharacterName(target.characterName);
    setFormVocation(target.vocation);
    setFormSkillCategory(target.skillCategory ?? 'axefighting');
    setFormIsServiceiro(target.isServiceiro);
    setFormSharePercent(target.serviceiroSharePercent !== undefined ? String(target.serviceiroSharePercent) : '');
    setFormOwnerCharacterName(target.ownerCharacterName ?? '');
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formCharacterName.trim();
    if (!trimmedName) {
      setFormError('Informe o nome do personagem — precisa bater exatamente com o nome no Tibia e na planilha de XP.');
      return;
    }

    let sharePercent: number | undefined;
    if (formIsServiceiro && formSharePercent.trim()) {
      const parsed = Number(formSharePercent);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        setFormError('Percentual do serviceiro precisa ser um número entre 0 e 100.');
        return;
      }
      sharePercent = parsed;
    }

    setSaving(true);
    try {
      const dto = {
        characterName: trimmedName,
        vocation: formVocation,
        skillCategory: formVocation === 'EK' ? formSkillCategory : undefined,
        isServiceiro: formIsServiceiro,
        serviceiroSharePercent: formIsServiceiro ? sharePercent : undefined,
        ownerCharacterName: formIsServiceiro ? formOwnerCharacterName.trim() || undefined : undefined,
      };
      if (editingId) {
        await updateMember(editingId, dto);
      } else {
        await createMember(dto);
      }
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar membro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', color: '#f8fafc' }}>
      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#38bdf8' }}>Configurações — Membros da Party</h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px', maxWidth: '520px' }}>
            Cadastre os jogadores base da party — eles aparecem no Dashboard, Histórico, Histórico de XP e Log de Drops.
            O nome do personagem precisa bater exatamente com o nome real no Tibia e com a coluna correspondente na sua planilha de XP.
          </p>
        </div>
        <button
          onClick={startCreate}
          style={{
            background: '#10b981', color: '#fff', border: 'none', padding: '10px 16px',
            borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap',
          }}
        >
          {showForm && !editingId ? 'Cancelar' : '+ Cadastrar Membro'}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <h3 style={{ margin: 0, fontSize: '13px', color: '#38bdf8' }}>
            {editingId ? 'Editar Membro' : 'Novo Membro'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>
              Nome do Personagem
              <input
                type="text"
                value={formCharacterName}
                onChange={(e) => setFormCharacterName(e.target.value)}
                placeholder="Ex: Thanatos Celestial"
                style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px', boxSizing: 'border-box' }}
              />
            </label>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>
              Vocação
              <select
                value={formVocation}
                onChange={(e) => setFormVocation(e.target.value as Vocation)}
                style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px', boxSizing: 'border-box' }}
              >
                {VOCATIONS.map((v) => (
                  <option key={v} value={v}>{VOCATION_ICON[v]} {VOCATION_LABEL[v]}</option>
                ))}
              </select>
            </label>
          </div>

          {formVocation === 'EK' && (
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>
              Skill treinada (pra buscar o valor certo nos Highscores)
              <select
                value={formSkillCategory}
                onChange={(e) => setFormSkillCategory(e.target.value as HighscoreSkillCategory)}
                style={{ width: '220px', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px', boxSizing: 'border-box' }}
              >
                {EK_SKILL_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{SKILL_CATEGORY_LABEL[cat]}</option>
                ))}
              </select>
            </label>
          )}

          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formIsServiceiro}
              onChange={(e) => setFormIsServiceiro(e.target.checked)}
            />
            Esse personagem é jogado por um serviceiro (conta de terceiro)
          </label>

          {formIsServiceiro && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>
                Dono da conta
                <input
                  type="text"
                  value={formOwnerCharacterName}
                  onChange={(e) => setFormOwnerCharacterName(e.target.value)}
                  placeholder="Nome do dono da conta"
                  style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px', boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>
                % que fica com o serviceiro
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formSharePercent}
                  onChange={(e) => setFormSharePercent(e.target.value)}
                  placeholder="Ex: 50"
                  style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px', boxSizing: 'border-box' }}
                />
              </label>
            </div>
          )}

          {formError && <span style={{ color: '#ef4444', fontSize: '12px' }}>{formError}</span>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 16px',
                borderRadius: '6px', fontWeight: 'bold', cursor: saving ? 'default' : 'pointer', fontSize: '13px',
                opacity: saving ? 0.7 : 1, alignSelf: 'flex-start',
              }}
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Salvar Membro'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {loading && <div className="loading">Carregando...</div>}
      {error && <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '13px' }}>{error}</div>}

      {!loading && !error && members.length === 0 && (
        <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '40px 0' }}>
          Nenhum membro cadastrado ainda.
        </p>
      )}

      {!loading && !error && members.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {members.map((m) => (
            <div
              key={m.id}
              style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
                padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span title={VOCATION_LABEL[m.vocation]} style={{ fontSize: '18px' }}>{VOCATION_ICON[m.vocation]}</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{m.characterName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {VOCATION_LABEL[m.vocation]}
                    {m.skillCategory ? ` · ${SKILL_CATEGORY_LABEL[m.skillCategory]}` : ''}
                    {m.isServiceiro ? ` · Serviceiro${m.ownerCharacterName ? ` (dono: ${m.ownerCharacterName})` : ''}${m.serviceiroSharePercent !== undefined ? ` · ${m.serviceiroSharePercent}%` : ''}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => startEdit(m.id)}
                  title="Editar membro"
                  style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '15px', opacity: 0.8 }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Remover "${m.characterName}" da lista de membros? Essa ação não pode ser desfeita.`)) {
                      removeMember(m.id);
                    }
                  }}
                  title="Remover membro"
                  style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '15px', opacity: 0.8 }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
