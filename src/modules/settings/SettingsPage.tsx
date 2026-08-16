import { useEffect, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useMembers } from '@/hooks/useMembers';
import { VOCATION_ICON, VOCATION_LABEL } from '@/services/vocation/vocation-display';
import { SKILL_CATEGORY_LABEL } from '@/services/tibiadata/tibiadata-client';
import { MemberFormModal } from './components/MemberFormModal';
import type { Member } from '@/types';

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

  // Modal de criar/editar membro (2026-08-16) — antes era um form inline na página;
  // virou padrão do sistema qualquer edição de item abrir em modal, mesmo padrão do
  // DropFormModal.tsx.
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingMember(null);
    setModalMode('create');
  };

  const openEdit = (member: Member) => {
    setEditingMember(member);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingMember(null);
  };

  // Vendedor Padrão é único por conta (índice único parcial no banco) — se o form marcar
  // um novo, desmarca o antigo primeiro, senão o banco rejeita a gravação. Ficava dentro
  // do handleSubmit antes do form virar modal; precisa continuar aqui porque só a página
  // tem a lista completa de members pra achar quem estava marcado.
  const handleModalSubmit = async (dto: Parameters<typeof createMember>[0]) => {
    if (dto.isDefaultSeller) {
      const currentDefault = members.find((m) => m.isDefaultSeller && m.id !== editingMember?.id);
      if (currentDefault) await updateMember(currentDefault.id, { isDefaultSeller: false });
    }
    return modalMode === 'edit' && editingMember ? updateMember(editingMember.id, dto) : createMember(dto);
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
          onClick={openCreate}
          style={{
            background: 'var(--color-accent)', color: 'var(--color-text)', border: 'none', padding: '10px 16px',
            borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap',
          }}
        >
          + Cadastrar Membro
        </button>
      </header>

      {modalMode && (
        <MemberFormModal
          mode={modalMode}
          member={editingMember ?? undefined}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
        />
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
                  onClick={() => openEdit(m)}
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
