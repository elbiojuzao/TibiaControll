import { useMemo, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useServiceiros } from '@/hooks/useServiceiros';
import { buildWhatsAppLink } from '@/services/serviceiro/whatsapp';
import { SERVICEIRO_VOCATIONS, VOCATION_ICON, VOCATION_LABEL } from '@/services/vocation/vocation-display';
import { ServiceiroFormModal } from './components/ServiceiroFormModal';
import type { Serviceiro, Vocation } from '@/types';

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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterVocations, setFilterVocations] = useState<Vocation[]>([]);

  // Modal de criar/editar serviceiro (2026-08-16) — antes era um form inline na página;
  // virou padrão do sistema qualquer edição de item abrir em modal, mesmo padrão do
  // DropFormModal.tsx/MemberFormModal.tsx.
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingServiceiro, setEditingServiceiro] = useState<Serviceiro | null>(null);

  const openCreate = () => {
    setEditingServiceiro(null);
    setModalMode('create');
  };

  const openEdit = (serviceiro: Serviceiro) => {
    setEditingServiceiro(serviceiro);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingServiceiro(null);
  };

  const filteredServiceiros = useMemo(() => {
    if (filterVocations.length === 0) return serviceiros;
    return serviceiros.filter((s) => s.vocations.some((v) => filterVocations.includes(v)));
  }, [serviceiros, filterVocations]);

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', color: 'var(--color-text)' }}>
      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-success)' }}>Serviceiros</h2>
          <p className="subtitulo-pagina">
            Contatos dos serviceiros da party. O número não fica visível — clique no ícone do WhatsApp pra abrir uma
            conversa direto com a mensagem que você escrever abaixo.
          </p>
        </div>
        <button onClick={openCreate} className="botao-primario">
          + Cadastrar Serviceiro
        </button>
      </header>

      {modalMode && (
        <ServiceiroFormModal
          key={editingServiceiro?.id ?? 'create'}
          mode={modalMode}
          serviceiro={editingServiceiro ?? undefined}
          onClose={closeModal}
          onSubmit={(dto) => (modalMode === 'edit' && editingServiceiro ? updateServiceiro(editingServiceiro.id, dto) : createServiceiro(dto as Parameters<typeof createServiceiro>[0]))}
        />
      )}

      <div className="card-compacto" style={{ marginBottom: '20px' }}>
        <label className="label-padrao">
          Mensagem a enviar
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: Fala! Bora fazer a hunt de hoje às 20h?"
            className="campo-input"
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </label>
      </div>

      {deleteError && <div className="banner-erro" style={{ marginBottom: '14px' }}>{deleteError}</div>}

      {!loading && serviceiros.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span className="texto-mudo" style={{ fontSize: '12px' }}>Filtrar por vocação:</span>
          <button
            onClick={() => setFilterVocations([])}
            style={{
              padding: '5px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px',
              border: filterVocations.length === 0 ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: filterVocations.length === 0 ? 'var(--color-accent-soft)' : 'var(--color-bg-input)',
              color: filterVocations.length === 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
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
                  padding: '5px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px',
                  border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: active ? 'var(--color-accent-soft)' : 'var(--color-bg-input)',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
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
        <p className="estado-vazio">Nenhum serviceiro cadastrado ainda.</p>
      )}

      {!loading && serviceiros.length > 0 && filteredServiceiros.length === 0 && (
        <p className="estado-vazio">Nenhum serviceiro encontrado para essa vocação.</p>
      )}

      {!loading && filteredServiceiros.length > 0 && (
        // Cards menores e quadrados (2026-08-16, pedido do usuário: "como se fossem
        // cartas") em vez de linhas horizontais cheias — grid responsivo, cada card
        // se ajusta a partir de ~150px de largura.
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {filteredServiceiros.map((s) => (
            <div key={s.id} className="card-compacto" style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{s.name}</div>
              <div className="texto-fraco" style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                Boneco: {s.characterName || '—'}
              </div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                {s.vocations.map((vocation) => (
                  <span key={vocation} title={VOCATION_LABEL[vocation]} style={{ fontSize: '14px' }}>
                    {VOCATION_ICON[vocation]}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
                <a
                  href={buildWhatsAppLink(s.phoneNumber, message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Chamar ${s.name} no WhatsApp`}
                  className="h30 w30"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-pill)',
                    background: '#25D366', color: 'var(--color-bg)', textDecoration: 'none',
                  }}
                >
                  <WhatsAppIcon />
                </a>
                <button onClick={() => openEdit(s)} title="Editar serviceiro" className="botao-icone">
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
