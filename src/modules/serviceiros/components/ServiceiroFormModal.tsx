import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { SERVICEIRO_VOCATIONS, VOCATION_ICON, VOCATION_LABEL } from '@/services/vocation/vocation-display';
import { fetchCharacterBasics, type CharacterBasics } from '@/services/tibiadata/tibiadata-client';
import type { CreateServiceiroDto, Serviceiro, Vocation } from '@/types';

function toggleVocation(list: Vocation[], vocation: Vocation): Vocation[] {
  return list.includes(vocation) ? list.filter((v) => v !== vocation) : [...list, vocation];
}

interface ServiceiroFormModalProps {
  mode: 'create' | 'edit';
  /** Obrigatório quando mode === 'edit' */
  serviceiro?: Serviceiro;
  onClose: () => void;
  onSubmit: (dto: Partial<CreateServiceiroDto>) => Promise<unknown>;
}

/** Formulário de criar/editar Serviceiro — antes vivia inline na página (2026-08-16:
 * virou modal, mesmo padrão de DropFormModal.tsx/MemberFormModal.tsx). O telefone
 * aparece pré-preenchido no modo edição (2026-08-17, pedido do usuário — antes ficava
 * sempre em branco de propósito, ver [[modulo_serviceiros]]): dá pra ver o número atual,
 * editar, ou apagar o campo pra remover o telefone (fica '' — a coluna é NOT NULL mas
 * aceita string vazia, sem precisar de migration). Continua não aparecendo em nenhum
 * outro lugar da UI (cards, hover) — só dentro deste modal. */
export function ServiceiroFormModal({ mode, serviceiro, onClose, onSubmit }: ServiceiroFormModalProps) {
  const [formName, setFormName] = useState(mode === 'edit' ? serviceiro!.name : '');
  const [formCharacterName, setFormCharacterName] = useState(mode === 'edit' ? serviceiro!.characterName : '');
  const [formPhone, setFormPhone] = useState(mode === 'edit' ? serviceiro!.phoneNumber : '');
  const [formVocations, setFormVocations] = useState<Vocation[]>(mode === 'edit' ? serviceiro!.vocations : []);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  // undefined = ainda não checou; null = checou e não achou; objeto = achou
  const [checkResult, setCheckResult] = useState<CharacterBasics | null | undefined>(undefined);

  const handleCheckCharacter = async () => {
    const name = formCharacterName.trim();
    if (!name) return;
    setChecking(true);
    try {
      const result = await fetchCharacterBasics(name);
      setCheckResult(result);
    } catch {
      setCheckResult(null);
    } finally {
      setChecking(false);
    }
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
    // No create, telefone é obrigatório. No edit, o campo já vem preenchido com o
    // número atual (2026-08-17) — deixar em branco agora significa "remover o
    // telefone", não mais "manter o atual" (esse comportamento antigo só fazia
    // sentido quando o campo escondia o valor salvo).
    if (mode === 'create' && digitsOnly.length < 10) {
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
      await onSubmit({
        name: trimmedName,
        characterName: trimmedCharacterName,
        phoneNumber: digitsOnly,
        vocations: formVocations,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar serviceiro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={mode === 'create' ? 'Novo Serviceiro' : 'Editar Serviceiro'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-coluna">
        <div className="grid-2col">
          <label className="label-padrao">
            Nome
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Dedinho"
              className="campo-input"
            />
          </label>
          <label className="label-padrao">
            Nome do Boneco (pagamento)
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="text"
                value={formCharacterName}
                onChange={(e) => {
                  setFormCharacterName(e.target.value);
                  setCheckResult(undefined);
                }}
                placeholder="Ex: Dedinho Knight"
                className="campo-input"
                style={{ marginTop: 0, flex: 1 }}
              />
              <button
                type="button"
                onClick={handleCheckCharacter}
                disabled={!formCharacterName.trim() || checking}
                className="botao-secundario"
                style={{ padding: '0 12px', whiteSpace: 'nowrap', fontSize: '12px' }}
              >
                {checking ? 'Checando...' : '🔍 Checar'}
              </button>
            </div>
            {checkResult && (
              <span className="texto-sucesso" style={{ display: 'block', fontSize: '11px', marginTop: '4px' }}>
                ✓ Level {checkResult.level} · {checkResult.vocation} · {checkResult.world}
              </span>
            )}
            {checkResult === null && (
              <span className="texto-perigo" style={{ display: 'block', fontSize: '11px', marginTop: '4px' }}>
                ✗ Personagem não encontrado — confira o nome
              </span>
            )}
          </label>
        </div>

        <label className="label-padrao">
          Telefone (WhatsApp, com DDI+DDD)
          <input
            type="text"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="Ex: 5511999998888"
            className="campo-input"
          />
        </label>

        <div>
          <span className="label-padrao" style={{ display: 'block', marginBottom: '6px' }}>
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
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px',
                    border: active ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
                    background: active ? 'var(--color-success-soft)' : 'var(--color-bg-input)',
                    color: active ? 'var(--color-success)' : 'var(--color-text-muted)',
                  }}
                >
                  <span>{VOCATION_ICON[vocation]}</span>
                  <span>{vocation}</span>
                </button>
              );
            })}
          </div>
        </div>

        {formError && <span className="texto-perigo" style={{ fontSize: '12px' }}>{formError}</span>}

        <button
          type="submit"
          disabled={saving}
          className="botao-primario"
          style={{ padding: '12px', borderRadius: 'var(--radius)', fontSize: '14px' }}
        >
          {saving ? 'Salvando...' : mode === 'create' ? 'Salvar Serviceiro' : 'Salvar Alterações'}
        </button>
      </form>
    </Modal>
  );
}
