import { useMemo, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useServiceiros } from '@/hooks/useServiceiros';
import { buildWhatsAppLink } from '@/services/serviceiro/whatsapp';
import { SERVICEIRO_VOCATIONS, VOCATION_ICON, VOCATION_LABEL } from '@/services/vocation/vocation-display';
import type { Vocation } from '@/types';

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.34.665 4.523 1.816 6.377L4 29l7.83-1.78A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.818a9.77 9.77 0 0 1-4.98-1.363l-.357-.212-4.646 1.056 1.08-4.53-.233-.37A9.77 9.77 0 0 1 5.2 15c0-5.965 4.84-10.818 10.804-10.818S26.8 9.035 26.8 15 21.968 24.818 16.004 24.818Zm5.36-7.51c-.294-.148-1.738-.858-2.007-.956-.269-.098-.465-.148-.66.148-.196.295-.758.955-.93 1.152-.171.196-.343.221-.637.074-.294-.148-1.242-.458-2.366-1.462-.874-.78-1.464-1.744-1.636-2.038-.171-.295-.018-.454.13-.601.133-.133.294-.344.44-.516.147-.172.196-.295.294-.492.098-.196.049-.369-.024-.516-.074-.148-.66-1.592-.905-2.18-.238-.573-.48-.495-.66-.504l-.562-.01c-.196 0-.516.074-.786.369-.269.295-1.03 1.005-1.03 2.45 0 1.446 1.055 2.842 1.203 3.038.147.196 2.078 3.172 5.036 4.448.704.304 1.253.486 1.681.622.706.225 1.348.193 1.856.117.566-.085 1.738-.71 1.983-1.396.245-.687.245-1.275.171-1.397-.073-.123-.269-.196-.563-.344Z"/>
    </svg>
  );
}

function toggleVocation(list: Vocation[], vocation: Vocation): Vocation[] {
  return list.includes(vocation) ? list.filter((v) => v !== vocation) : [...list, vocation];
}

export function ServiceirosPage() {
  const { accountId } = useAccount();
  const { serviceiros, loading, createServiceiro, updateServiceiro, removeServiceiro } = useServiceiros(accountId);

  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCharacterName, setFormCharacterName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formVocations, setFormVocations] = useState<Vocation[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterVocations, setFilterVocations] = useState<Vocation[]>([]);

  const filteredServiceiros = useMemo(() => {
    if (filterVocations.length === 0) return serviceiros;
    return serviceiros.filter((s) => s.vocations.some((v) => filterVocations.includes(v)));
  }, [serviceiros, filterVocations]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName('');
    setFormCharacterName('');
    setFormPhone('');
    setFormVocations([]);
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
    const target = serviceiros.find((s) => s.id === id);
    if (!target) return;
    setEditingId(id);
    setFormName(target.name);
    setFormCharacterName(target.characterName);
    setFormPhone('');
    setFormVocations(target.vocations);
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formName.trim();
    const trimmedCharacterName = formCharacterName.trim();
    const digitsOnly = formPhone.replace(/\D/g, '');

    if (!trimmedName) {
      setFormError('Informe o nome do serviceiro.');
      return;
    }
    if (!trimmedCharacterName) {
      setFormError('Informe o nome do boneco usado para pagamento.');
      return;
    }
    if (!editingId && digitsOnly.length < 10) {
      setFormError('Informe um telefone válido, com DDI e DDD (ex: 5511999998888).');
      return;
    }
    if (digitsOnly && digitsOnly.length < 10) {
      setFormError('Telefone inválido — precisa ter DDI e DDD (ex: 5511999998888).');
      return;
    }
    if (formVocations.length === 0) {
      setFormError('Selecione ao menos uma vocação.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateServiceiro(editingId, {
          name: trimmedName,
          characterName: trimmedCharacterName,
          vocations: formVocations,
          ...(digitsOnly ? { phoneNumber: digitsOnly } : {}),
        });
      } else {
        await createServiceiro({
          name: trimmedName,
          characterName: trimmedCharacterName,
          phoneNumber: digitsOnly,
          vocations: formVocations,
        });
      }
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar serviceiro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', color: '#f8fafc' }}>
      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#10b981' }}>Serviceiros</h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Contatos dos serviceiros da party. O número não fica visível — clique no ícone do WhatsApp pra abrir uma
            conversa direto com a mensagem que você escrever abaixo.
          </p>
        </div>
        <button
          onClick={startCreate}
          style={{
            background: '#10b981', color: '#fff', border: 'none', padding: '10px 16px',
            borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap',
          }}
        >
          {showForm && !editingId ? 'Cancelar' : '+ Cadastrar Serviceiro'}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <h3 style={{ margin: 0, fontSize: '13px', color: '#38bdf8' }}>
            {editingId ? 'Editar Serviceiro' : 'Novo Serviceiro'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>
              Nome
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Dedinho"
                style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px', boxSizing: 'border-box' }}
              />
            </label>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>
              Nome do Boneco (pagamento)
              <input
                type="text"
                value={formCharacterName}
                onChange={(e) => setFormCharacterName(e.target.value)}
                placeholder="Ex: Dedinho Knight"
                style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px', boxSizing: 'border-box' }}
              />
            </label>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>
              Telefone (WhatsApp, com DDI+DDD)
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder={editingId ? 'Deixe em branco pra manter o atual' : 'Ex: 5511999998888'}
                style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px', boxSizing: 'border-box' }}
              />
            </label>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Faz serviço em quais vocações?
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SERVICEIRO_VOCATIONS.map((vocation) => {
                const active = formVocations.includes(vocation);
                return (
                  <button
                    key={vocation}
                    type="button"
                    onClick={() => setFormVocations((prev) => toggleVocation(prev, vocation))}
                    title={VOCATION_LABEL[vocation]}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                      border: active ? '1px solid #10b981' : '1px solid #334155',
                      background: active ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
                      color: active ? '#10b981' : '#94a3b8',
                    }}
                  >
                    <span>{VOCATION_ICON[vocation]}</span>
                    <span>{vocation}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Salvar Serviceiro'}
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

      <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '20px' }}>
        <label style={{ fontSize: '12px', color: '#94a3b8' }}>
          Mensagem a enviar
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: Fala! Bora fazer a hunt de hoje às 20h?"
            style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '10px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </label>
      </div>

      {deleteError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
          {deleteError}
        </div>
      )}

      {!loading && serviceiros.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Filtrar por vocação:</span>
          <button
            onClick={() => setFilterVocations([])}
            style={{
              padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
              border: filterVocations.length === 0 ? '1px solid #38bdf8' : '1px solid #334155',
              background: filterVocations.length === 0 ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              color: filterVocations.length === 0 ? '#38bdf8' : '#94a3b8',
            }}
          >
            Todos
          </button>
          {SERVICEIRO_VOCATIONS.map((vocation) => {
            const active = filterVocations.includes(vocation);
            return (
              <button
                key={vocation}
                onClick={() => setFilterVocations((prev) => toggleVocation(prev, vocation))}
                title={VOCATION_LABEL[vocation]}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                  border: active ? '1px solid #38bdf8' : '1px solid #334155',
                  background: active ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
                  color: active ? '#38bdf8' : '#94a3b8',
                }}
              >
                <span>{VOCATION_ICON[vocation]}</span>
                <span>{vocation}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading && <div className="loading">Carregando...</div>}

      {!loading && serviceiros.length === 0 && (
        <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '40px 0' }}>
          Nenhum serviceiro cadastrado ainda.
        </p>
      )}

      {!loading && serviceiros.length > 0 && filteredServiceiros.length === 0 && (
        <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '40px 0' }}>
          Nenhum serviceiro encontrado para essa vocação.
        </p>
      )}

      {!loading && filteredServiceiros.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredServiceiros.map((s) => (
            <div
              key={s.id}
              style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
                padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Boneco: {s.characterName || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {s.vocations.map((vocation) => (
                    <span key={vocation} title={VOCATION_LABEL[vocation]} style={{ fontSize: '14px' }}>
                      {VOCATION_ICON[vocation]}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a
                  href={buildWhatsAppLink(s.phoneNumber, message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Chamar ${s.name} no WhatsApp`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: '#25D366', color: '#0f172a', textDecoration: 'none',
                  }}
                >
                  <WhatsAppIcon />
                </a>
                <button
                  onClick={() => startEdit(s.id)}
                  title="Editar serviceiro"
                  style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '15px', opacity: 0.8 }}
                >
                  ✏️
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Remover "${s.name}" da lista de serviceiros? Essa ação não pode ser desfeita.`)) return;
                    setDeleteError(null);
                    try {
                      await removeServiceiro(s.id);
                    } catch (err) {
                      setDeleteError(err instanceof Error ? err.message : 'Erro ao remover serviceiro.');
                    }
                  }}
                  title="Remover serviceiro"
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
