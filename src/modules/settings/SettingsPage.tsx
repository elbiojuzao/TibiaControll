import { useEffect, useState } from 'react';
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
  const { accountId, account, updatePartyName } = useAccount();
  const { members, loading, error, createMember, updateMember, removeMember } = useMembers(accountId);

  // Nome da party (2026-08-16, pedido do usuário): editável aqui, salvo no banco
  // (accounts.party_name) — vale pra qualquer um que logar com a credencial
  // compartilhada da PT, não só pra quem editou. useAccount() cuida de propagar a
  // mudança pro resto do app (ex: topbar) via cache em localStorage, ver
  // services/account/account-cache.ts.
  const [formPartyName, setFormPartyName] = useState('');
  const [savingPartyName, setSavingPartyName] = useState(false);
  const [partyNameError, setPartyNameError] = useState<string | null>(null);
  const [partyNameSaved, setPartyNameSaved] = useState(false);

  useEffect(() => {
    if (account) setFormPartyName(account.partyName);
  }, [account]);

  const handleSavePartyName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formPartyName.trim();
    if (!trimmed) return setPartyNameError('Informe um nome pra party.');
    setPartyNameError(null);
    setSavingPartyName(true);
    try {
      await updatePartyName(trimmed);
      setPartyNameSaved(true);
      setTimeout(() => setPartyNameSaved(false), 2000);
    } catch (err) {
      setPartyNameError(err instanceof Error ? err.message : 'Erro ao salvar nome da party.');
    } finally {
      setSavingPartyName(false);
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCharacterName, setFormCharacterName] = useState('');
  const [formVocation, setFormVocation] = useState<Vocation>('EK');
  const [formSkillCategory, setFormSkillCategory] = useState<HighscoreSkillCategory>('axefighting');
  const [formIsServiceiro, setFormIsServiceiro] = useState(false);
  const [formSharePercent, setFormSharePercent] = useState('');
  const [formOwnerCharacterName, setFormOwnerCharacterName] = useState('');
  const [formIsDefaultSeller, setFormIsDefaultSeller] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormCharacterName('');
    setFormVocation('EK');
    setFormSkillCategory('axefighting');
    setFormIsServiceiro(false);
    setFormSharePercent('');
    setFormOwnerCharacterName('');
    setFormIsDefaultSeller(false);
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
    setFormIsDefaultSeller(target.isDefaultSeller ?? false);
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
      // Vendedor Padrão é único por conta (índice único parcial no banco) — se marcar
      // um novo, desmarca o antigo primeiro, senão o banco rejeita a gravação.
      if (formIsDefaultSeller) {
        const currentDefault = members.find((m) => m.isDefaultSeller && m.id !== editingId);
        if (currentDefault) await updateMember(currentDefault.id, { isDefaultSeller: false });
      }

      const dto = {
        characterName: trimmedName,
        vocation: formVocation,
        skillCategory: formVocation === 'EK' ? formSkillCategory : undefined,
        isServiceiro: formIsServiceiro,
        serviceiroSharePercent: formIsServiceiro ? sharePercent : undefined,
        ownerCharacterName: formIsServiceiro ? formOwnerCharacterName.trim() || undefined : undefined,
        isDefaultSeller: formIsDefaultSeller,
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
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', color: 'var(--color-text)' }}>
      <div className="card" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: 'var(--space-card)', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--color-accent)' }}>Nome da Party</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Aparece na topbar de qualquer um que logar com a credencial compartilhada da PT.
        </p>
        <form onSubmit={handleSavePartyName} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={formPartyName}
            onChange={(e) => setFormPartyName(e.target.value)}
            placeholder="Ex: Thanatos PT"
            style={{ flex: '1 1 240px', minWidth: '200px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={savingPartyName || !account}
            style={{
              background: partyNameSaved ? 'var(--color-success)' : 'var(--color-accent)', color: 'var(--color-text)', border: 'none', padding: '8px 16px',
              borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: savingPartyName ? 'default' : 'pointer', fontSize: '13px', opacity: savingPartyName ? 0.7 : 1, whiteSpace: 'nowrap',
            }}
          >
            {savingPartyName ? 'Salvando...' : partyNameSaved ? 'Salvo!' : 'Salvar Nome'}
          </button>
        </form>
        {partyNameError && <span style={{ display: 'block', marginTop: '8px', color: 'var(--color-danger)', fontSize: '12px' }}>{partyNameError}</span>}
      </div>

      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-accent)' }}>Configurações — Membros da Party</h2>
          <p style={{ margin: '5px 0 0 0', color: 'var(--color-text-muted)', fontSize: '14px', maxWidth: '520px' }}>
            Cadastre os jogadores base da party — eles aparecem no Dashboard, Histórico, Histórico de XP e Log de Drops.
            O nome do personagem precisa bater exatamente com o nome real no Tibia e com a coluna correspondente na sua planilha de XP.
          </p>
        </div>
        <button
          onClick={startCreate}
          style={{
            background: 'var(--color-accent)', color: 'var(--color-text)', border: 'none', padding: '10px 16px',
            borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap',
          }}
        >
          {showForm && !editingId ? 'Cancelar' : '+ Cadastrar Membro'}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{ background: 'var(--color-bg-elevated)', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--color-accent)' }}>
            {editingId ? 'Editar Membro' : 'Novo Membro'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Nome do Personagem
              <input
                type="text"
                value={formCharacterName}
                onChange={(e) => setFormCharacterName(e.target.value)}
                placeholder="Ex: Thanatos Celestial"
                style={{ width: '100%', marginTop: '4px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px', boxSizing: 'border-box' }}
              />
            </label>
            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Vocação
              <select
                value={formVocation}
                onChange={(e) => setFormVocation(e.target.value as Vocation)}
                style={{ width: '100%', marginTop: '4px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px', boxSizing: 'border-box' }}
              >
                {VOCATIONS.map((v) => (
                  <option key={v} value={v}>{VOCATION_ICON[v]} {VOCATION_LABEL[v]}</option>
                ))}
              </select>
            </label>
          </div>

          {formVocation === 'EK' && (
            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Skill treinada (pra buscar o valor certo nos Highscores)
              <select
                value={formSkillCategory}
                onChange={(e) => setFormSkillCategory(e.target.value as HighscoreSkillCategory)}
                style={{ width: '220px', marginTop: '4px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px', boxSizing: 'border-box' }}
              >
                {EK_SKILL_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{SKILL_CATEGORY_LABEL[cat]}</option>
                ))}
              </select>
            </label>
          )}

          <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formIsServiceiro}
              onChange={(e) => setFormIsServiceiro(e.target.checked)}
            />
            Esse personagem é jogado por um serviceiro (conta de terceiro)
          </label>

          <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formIsDefaultSeller}
              onChange={(e) => setFormIsDefaultSeller(e.target.checked)}
            />
            Vendedor Padrão — quem efetivamente vende os itens (aparece como "quem paga" nos comandos de transferência do drop vendido). Só 1 por vez.
          </label>

          {formIsServiceiro && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Dono da conta
                <input
                  type="text"
                  value={formOwnerCharacterName}
                  onChange={(e) => setFormOwnerCharacterName(e.target.value)}
                  placeholder="Nome do dono da conta"
                  style={{ width: '100%', marginTop: '4px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px', boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                % que fica com o serviceiro
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formSharePercent}
                  onChange={(e) => setFormSharePercent(e.target.value)}
                  placeholder="Ex: 50"
                  style={{ width: '100%', marginTop: '4px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px', boxSizing: 'border-box' }}
                />
              </label>
            </div>
          )}

          {formError && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{formError}</span>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'var(--color-accent)', color: 'var(--color-bg)', border: 'none', padding: '8px 16px',
                borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: saving ? 'default' : 'pointer', fontSize: '13px',
                opacity: saving ? 0.7 : 1, alignSelf: 'flex-start',
              }}
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Salvar Membro'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{ background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {deleteError && (
        <div style={{ background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '14px', fontSize: '13px' }}>
          {deleteError}
        </div>
      )}

      {loading && <div className="loading">Carregando...</div>}
      {error && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-danger)', fontSize: '13px' }}>{error}</div>}

      {!loading && !error && members.length === 0 && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-faint)', textAlign: 'center', margin: '40px 0' }}>
          Nenhum membro cadastrado ainda.
        </p>
      )}

      {!loading && !error && members.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {members.map((m) => (
            <div
              key={m.id}
              style={{
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span title={VOCATION_LABEL[m.vocation]} style={{ fontSize: '18px' }}>{VOCATION_ICON[m.vocation]}</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{m.characterName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>
                    {VOCATION_LABEL[m.vocation]}
                    {m.skillCategory ? ` · ${SKILL_CATEGORY_LABEL[m.skillCategory]}` : ''}
                    {m.isServiceiro ? ` · Serviceiro${m.ownerCharacterName ? ` (dono: ${m.ownerCharacterName})` : ''}${m.serviceiroSharePercent !== undefined ? ` · ${m.serviceiroSharePercent}%` : ''}` : ''}
                    {m.isDefaultSeller ? ' · 💰 Vendedor Padrão' : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => startEdit(m.id)}
                  title="Editar membro"
                  style={{ background: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', opacity: 0.8 }}
                >
                  ✏️
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Remover "${m.characterName}" da lista de membros? Essa ação não pode ser desfeita.`)) return;
                    setDeleteError(null);
                    try {
                      await removeMember(m.id);
                    } catch (err) {
                      setDeleteError(err instanceof Error ? err.message : 'Erro ao remover membro.');
                    }
                  }}
                  title="Remover membro"
                  style={{ background: 'transparent', color: 'var(--color-danger)', border: 'none', cursor: 'pointer', fontSize: '15px', opacity: 0.8 }}
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
