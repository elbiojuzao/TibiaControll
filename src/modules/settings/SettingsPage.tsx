import { useEffect, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useMembers } from '@/hooks/useMembers';
import { usePartyEvents } from '@/hooks/usePartyEvents';
import { useAccountSecurity } from '@/hooks/useAccountSecurity';
import { VOCATION_ICON, VOCATION_LABEL } from '@/services/vocation/vocation-display';
import { SKILL_CATEGORY_LABEL } from '@/services/tibiadata/tibiadata-client';
import { PARTY_EVENT_CATEGORY_ICON, PARTY_EVENT_CATEGORY_LABEL } from '@/services/party-events/party-event-display';
import { MemberFormModal } from './components/MemberFormModal';
import { PartyEventFormModal } from './components/PartyEventFormModal';
import type { Member, PartyEvent } from '@/types';

export function SettingsPage() {
  const { accountId, account, updatePartyName } = useAccount();
  const { members, loading, error, createMember, updateMember, removeMember } = useMembers(accountId);
  const { emailInfo, changePassword, changeEmail } = useAccountSecurity();

  // Eventos da party (2026-08-28, movido do Calendário — pedido do usuário: "o adicionar
  // evento tem que ser em configurações... ele vai adicionar para todas as contas e não
  // apenas para a party"; o Calendário passou a ser só leitura/exibição, ver
  // CalendarioPage.tsx). O evento continua compartilhado com a conta/PT inteira, só a
  // criação saiu de lá.
  const {
    events: partyEvents,
    loading: partyEventsLoading,
    error: partyEventsError,
    createEvent: createPartyEvent,
    updateEvent: updatePartyEvent,
    deleteEvent: deletePartyEvent,
  } = usePartyEvents(accountId);
  // Editar/excluir evento (2026-08-31, pedido do usuário: "podemos reutilizar [a modal]
  // para excluir um evento ou editar evento... mostrar um historico dos ultimos 5 eventos")
  // — mesmo padrão create/edit já usado pra Membros logo abaixo (modalMode/editingMember).
  const [eventModalMode, setEventModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingEvent, setEditingEvent] = useState<PartyEvent | null>(null);
  const [eventDeleteError, setEventDeleteError] = useState<string | null>(null);

  const openCreateEvent = () => {
    setEditingEvent(null);
    setEventModalMode('create');
  };

  const openEditEvent = (ev: PartyEvent) => {
    setEditingEvent(ev);
    setEventModalMode('edit');
  };

  const closeEventModal = () => {
    setEventModalMode(null);
    setEditingEvent(null);
  };

  const handleEventModalSubmit = (dto: Parameters<typeof createPartyEvent>[0]) =>
    eventModalMode === 'edit' && editingEvent ? updatePartyEvent(editingEvent.id, dto) : createPartyEvent(dto);

  const handleDeleteEvent = async (ev: PartyEvent) => {
    if (!window.confirm(`Excluir o evento "${ev.title}"? Essa ação não pode ser desfeita.`)) return;
    setEventDeleteError(null);
    try {
      await deletePartyEvent(ev.id);
    } catch (err) {
      setEventDeleteError(err instanceof Error ? err.message : 'Erro ao excluir evento.');
    }
  };

  // Histórico mostra só os 5 mais recentes (pedido do usuário) — partyEvents já vem
  // ordenado desc por start_date (HttpPartyEventRepository.findAll), mock mantém a mesma
  // ordem (create sempre prepende).
  const recentPartyEvents = partyEvents.slice(0, 5);

  // Trocar senha (2026-08-25, pedido do usuário: "ajustar as configurações das contas,
  // senha email..."). Pede a senha ATUAL como confirmação extra antes de trocar — decisão
  // confirmada com o usuário via AskUserQuestion (a API do Supabase não exige isso sozinha,
  // é uma camada de segurança a mais, mesmo padrão de telas de conta em outros produtos).
  const [currentPasswordForPw, setCurrentPasswordForPw] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('A confirmação não bate com a nova senha.');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPasswordForPw, newPassword);
      setCurrentPasswordForPw('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erro ao trocar senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Trocar e-mail — o Supabase manda um link de confirmação pro endereço NOVO; o e-mail só
  // muda de verdade depois de clicar nesse link (ver useAccountSecurity/supabase-auth.ts).
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailChangeSent, setEmailChangeSent] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setEmailError('Informe um e-mail válido.');
      return;
    }
    setSavingEmail(true);
    try {
      await changeEmail(currentPasswordForEmail, trimmedEmail);
      setCurrentPasswordForEmail('');
      setNewEmail('');
      setEmailChangeSent(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Erro ao trocar e-mail.');
    } finally {
      setSavingEmail(false);
    }
  };

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
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--color-accent)' }}>Conta</h3>
        <p className="texto-mudo" style={{ margin: '0 0 12px 0', fontSize: '12px' }}>
          Login compartilhado da PT — trocar aqui vale pra qualquer um que usa essa credencial, não só quem está trocando.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <span className="label-padrao" style={{ display: 'block', marginBottom: '4px' }}>E-mail atual</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '13px' }}>{emailInfo?.email ?? '—'}</strong>
            {emailInfo && (
              emailInfo.emailConfirmedAt
                ? <span className="texto-sucesso" style={{ fontSize: '11px' }}>✓ Confirmado</span>
                : <span className="texto-perigo" style={{ fontSize: '11px' }}>⏳ Não confirmado</span>
            )}
          </div>
          {emailInfo?.pendingNewEmail && (
            <div className="texto-mudo" style={{ fontSize: '11px', marginTop: '4px' }}>
              Troca pendente pra <strong>{emailInfo.pendingNewEmail}</strong> — confirme pelo link enviado nesse e-mail pra valer de verdade.
            </div>
          )}
        </div>

        <div className="grid-2col" style={{ gap: '20px' }}>
          <form onSubmit={handleChangePassword} className="form-coluna">
            <span className="label-padrao">Trocar senha</span>
            <input
              type="password"
              value={currentPasswordForPw}
              onChange={(e) => setCurrentPasswordForPw(e.target.value)}
              placeholder="Senha atual"
              className="campo-input"
              autoComplete="current-password"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              className="campo-input"
              autoComplete="new-password"
            />
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirmar nova senha"
              className="campo-input"
              autoComplete="new-password"
            />
            {passwordError && <span className="texto-perigo" style={{ fontSize: '11px' }}>{passwordError}</span>}
            <button
              type="submit"
              disabled={savingPassword || !currentPasswordForPw || !newPassword}
              className="botao-secundario"
              style={{ color: passwordSaved ? 'var(--color-success)' : undefined }}
            >
              {savingPassword ? 'Salvando...' : passwordSaved ? '✓ Senha alterada!' : 'Trocar Senha'}
            </button>
          </form>

          <form onSubmit={handleChangeEmail} className="form-coluna">
            <span className="label-padrao">Trocar e-mail</span>
            <input
              type="password"
              value={currentPasswordForEmail}
              onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
              placeholder="Senha atual"
              className="campo-input"
              autoComplete="current-password"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setEmailChangeSent(false); }}
              placeholder="Novo e-mail"
              className="campo-input"
              autoComplete="email"
            />
            {emailError && <span className="texto-perigo" style={{ fontSize: '11px' }}>{emailError}</span>}
            {emailChangeSent && (
              <span className="texto-sucesso" style={{ fontSize: '11px' }}>
                ✓ Link de confirmação enviado! Clique nele no novo e-mail pra confirmar a troca.
              </span>
            )}
            <button
              type="submit"
              disabled={savingEmail || !currentPasswordForEmail || !newEmail}
              className="botao-secundario"
            >
              {savingEmail ? 'Enviando...' : 'Trocar E-mail'}
            </button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--color-accent)' }}>Nome da Party</h3>
        <p className="texto-mudo" style={{ margin: '0 0 12px 0', fontSize: '12px' }}>
          Aparece na topbar de qualquer um que logar com a credencial compartilhada da PT.
        </p>
        <form onSubmit={handleSavePartyName} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={formPartyName}
            onChange={(e) => setFormPartyName(e.target.value)}
            placeholder="Ex: Thanatos PT"
            className="campo-input"
            style={{ flex: '1 1 240px', minWidth: '200px', marginTop: 0 }}
          />
          <button
            type="submit"
            disabled={savingPartyName || !account}
            className="botao-primario"
            style={{ background: partyNameSaved ? 'var(--color-success)' : 'var(--color-accent)', opacity: savingPartyName ? 0.7 : 1 }}
          >
            {savingPartyName ? 'Salvando...' : partyNameSaved ? 'Salvo!' : 'Salvar Nome'}
          </button>
        </form>
        {partyNameError && <span className="texto-perigo" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>{partyNameError}</span>}
      </div>

      {/* "Adicionar Eventos" — só pra conta Admin (2026-08-28, pedido do usuário: "a
          adicionar eventos... só pode aparecer para contas Admin"). Vira um mural: só admin
          cria, mas qualquer conta autenticada VÊ os eventos no Calendário (RLS
          "party_events_select_all" + hook usePartyEvents/findAll, ver
          [[modulo-eventos-party]]). Nome enxuto a pedido do usuário — sem subtítulo. */}
      {account?.isAdmin && (
        <>
          <header className="page-header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-accent)' }}>Adicionar Eventos</h2>
            <button onClick={openCreateEvent} className="botao-primario">
              + Adicionar Evento
            </button>
          </header>

          {eventModalMode && (
            <PartyEventFormModal
              key={editingEvent?.id ?? 'create'}
              mode={eventModalMode}
              event={editingEvent ?? undefined}
              onClose={closeEventModal}
              onSubmit={handleEventModalSubmit}
            />
          )}

          {eventDeleteError && <div className="banner-erro" style={{ marginBottom: '14px' }}>{eventDeleteError}</div>}

          {partyEventsLoading && <div className="loading">Carregando...</div>}
          {partyEventsError && <div className="texto-perigo" style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>{partyEventsError}</div>}

          {!partyEventsLoading && !partyEventsError && recentPartyEvents.length === 0 && (
            <p className="estado-vazio">Nenhum evento cadastrado ainda.</p>
          )}

          {!partyEventsLoading && !partyEventsError && recentPartyEvents.length > 0 && (
            <>
              <span className="texto-mudo" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                Histórico (últimos {recentPartyEvents.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
                {recentPartyEvents.map((ev) => (
                  <div key={ev.id} className="card-compacto" style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{ev.title}</div>
                        <div className="texto-fraco" style={{ fontSize: '11px', marginTop: '2px' }}>
                          {ev.startDate}{ev.endDate !== ev.startDate ? ` — ${ev.endDate}` : ''}
                        </div>
                        {ev.description && (
                          <div className="texto-mudo" style={{ fontSize: '12px', marginTop: '4px' }}>{ev.description}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {ev.categories.map((cat) => (
                            <span key={cat} title={PARTY_EVENT_CATEGORY_LABEL[cat]} style={{ fontSize: '16px' }}>
                              {PARTY_EVENT_CATEGORY_ICON[cat]}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => openEditEvent(ev)} title="Editar evento" className="botao-icone">
                            ✏️
                          </button>
                          <button onClick={() => handleDeleteEvent(ev)} title="Excluir evento" className="botao-icone-perigo">
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-accent)' }}>Configurações — Membros da Party</h2>
          <p className="subtitulo-pagina" style={{ maxWidth: '520px' }}>
            Cadastre os jogadores base da party — eles aparecem no Dashboard, Histórico, Histórico de XP e Log de Drops.
            O nome do personagem precisa bater exatamente com o nome real no Tibia e com a coluna correspondente na sua planilha de XP.
          </p>
        </div>
        <button onClick={openCreate} className="botao-primario">
          + Cadastrar Membro
        </button>
      </header>

      {modalMode && (
        <MemberFormModal
          key={editingMember?.id ?? 'create'}
          mode={modalMode}
          member={editingMember ?? undefined}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
        />
      )}

      {deleteError && <div className="banner-erro" style={{ marginBottom: '14px' }}>{deleteError}</div>}

      {loading && <div className="loading">Carregando...</div>}
      {error && <div className="texto-perigo" style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>{error}</div>}

      {!loading && !error && members.length === 0 && (
        <p className="estado-vazio">Nenhum membro cadastrado ainda.</p>
      )}

      {!loading && !error && members.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {members.map((m) => (
            <div key={m.id} className="card-compacto" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span title={VOCATION_LABEL[m.vocation]} style={{ fontSize: '18px' }}>{VOCATION_ICON[m.vocation]}</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{m.characterName}</div>
                  <div className="texto-fraco" style={{ fontSize: '11px' }}>
                    {VOCATION_LABEL[m.vocation]}
                    {m.skillCategory ? ` · ${SKILL_CATEGORY_LABEL[m.skillCategory]}` : ''}
                    {m.isServiceiro ? ` · Serviceiro${m.ownerCharacterName ? ` (dono: ${m.ownerCharacterName})` : ''}${m.serviceiroSharePercent !== undefined ? ` · ${m.serviceiroSharePercent}%` : ''}` : ''}
                    {m.isDefaultSeller ? ' · 💰 Vendedor Padrão' : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => openEdit(m)} title="Editar membro" className="botao-icone">
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
                  className="botao-icone-perigo"
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
