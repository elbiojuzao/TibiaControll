import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { VOCATION_ICON, VOCATION_LABEL } from '@/services/vocation/vocation-display';
import { SKILL_CATEGORY_LABEL } from '@/services/tibiadata/tibiadata-client';
import type { CreateMemberDto, HighscoreSkillCategory, Member, Vocation } from '@/types';

const VOCATIONS: Vocation[] = ['EK', 'ED', 'MS', 'RP', 'EM', 'OTHER'];
/** Só EK é ambíguo (pode treinar Axe/Sword/Club) — outras vocações inferem a categoria
 * certa sozinhas, ver resolveSkillCategory() em tibiadata-client.ts. */
const EK_SKILL_OPTIONS: HighscoreSkillCategory[] = ['axefighting', 'swordfighting', 'clubfighting'];

interface MemberFormModalProps {
  mode: 'create' | 'edit';
  /** Obrigatório quando mode === 'edit' */
  member?: Member;
  onClose: () => void;
  onSubmit: (dto: CreateMemberDto) => Promise<unknown>;
}

/** Formulário de criar/editar Membro — antes vivia inline na página (2026-08-16: virou
 * modal, mesmo padrão de DropFormModal.tsx, que passou a ser o padrão do sistema pra
 * qualquer edição de item, não só drop). Usa o catálogo de classes reutilizáveis de
 * global.css (.label-padrao/.campo-input/.botao-primario/etc, ver o comentário lá) em vez
 * de `style={{}}` repetido — pedido do usuário no mesmo dia. */
export function MemberFormModal({ mode, member, onClose, onSubmit }: MemberFormModalProps) {
  const [formCharacterName, setFormCharacterName] = useState(mode === 'edit' ? member!.characterName : '');
  const [formVocation, setFormVocation] = useState<Vocation>(mode === 'edit' ? member!.vocation : 'EK');
  const [formSkillCategory, setFormSkillCategory] = useState<HighscoreSkillCategory>(mode === 'edit' ? member!.skillCategory ?? 'axefighting' : 'axefighting');
  const [formIsServiceiro, setFormIsServiceiro] = useState(mode === 'edit' ? member!.isServiceiro : false);
  const [formSharePercent, setFormSharePercent] = useState(mode === 'edit' && member!.serviceiroSharePercent !== undefined ? String(member!.serviceiroSharePercent) : '');
  const [formOwnerCharacterName, setFormOwnerCharacterName] = useState(mode === 'edit' ? member!.ownerCharacterName ?? '' : '');
  const [formIsDefaultSeller, setFormIsDefaultSeller] = useState(mode === 'edit' ? member!.isDefaultSeller ?? false : false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmação ao sair sem salvar (2026-08-26, pedido do usuário) — mesmo padrão de
  // DropFormModal: snapshot dos campos na 1ª renderização (= valor inicial) comparado com
  // os valores atuais.
  const [initialSnapshot] = useState(() => JSON.stringify({
    formCharacterName, formVocation, formSkillCategory, formIsServiceiro, formSharePercent, formOwnerCharacterName, formIsDefaultSeller,
  }));
  const isDirty = JSON.stringify({
    formCharacterName, formVocation, formSkillCategory, formIsServiceiro, formSharePercent, formOwnerCharacterName, formIsDefaultSeller,
  }) !== initialSnapshot;

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
      await onSubmit({
        characterName: trimmedName,
        vocation: formVocation,
        skillCategory: formVocation === 'EK' ? formSkillCategory : undefined,
        isServiceiro: formIsServiceiro,
        serviceiroSharePercent: formIsServiceiro ? sharePercent : undefined,
        ownerCharacterName: formIsServiceiro ? formOwnerCharacterName.trim() || undefined : undefined,
        isDefaultSeller: formIsDefaultSeller,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar membro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={mode === 'create' ? 'Novo Membro' : 'Editar Membro'} onClose={onClose} isDirty={isDirty}>
      <form onSubmit={handleSubmit} className="form-coluna">
        <div className="grid-2col">
          <label className="label-padrao">
            Nome do Personagem
            <input
              type="text"
              value={formCharacterName}
              onChange={(e) => setFormCharacterName(e.target.value)}
              placeholder="Ex: Thanatos Celestial"
              className="campo-input"
            />
          </label>
          <label className="label-padrao">
            Vocação
            <select
              value={formVocation}
              onChange={(e) => setFormVocation(e.target.value as Vocation)}
              className="campo-input"
            >
              {VOCATIONS.map((v) => (
                <option key={v} value={v}>{VOCATION_ICON[v]} {VOCATION_LABEL[v]}</option>
              ))}
            </select>
          </label>
        </div>

        {formVocation === 'EK' && (
          <label className="label-padrao">
            Skill treinada (pra buscar o valor certo nos Highscores)
            <select
              value={formSkillCategory}
              onChange={(e) => setFormSkillCategory(e.target.value as HighscoreSkillCategory)}
              className="campo-input w220"
            >
              {EK_SKILL_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{SKILL_CATEGORY_LABEL[cat]}</option>
              ))}
            </select>
          </label>
        )}

        <label className="label-checkbox">
          <input
            type="checkbox"
            checked={formIsServiceiro}
            onChange={(e) => setFormIsServiceiro(e.target.checked)}
          />
          Esse personagem é jogado por um serviceiro (conta de terceiro)
        </label>

        <label className="label-checkbox">
          <input
            type="checkbox"
            checked={formIsDefaultSeller}
            onChange={(e) => setFormIsDefaultSeller(e.target.checked)}
          />
          Vendedor Padrão — quem efetivamente vende os itens (aparece como "quem paga" nos comandos de transferência do drop vendido). Só 1 por vez.
        </label>

        {formIsServiceiro && (
          <div className="grid-2col">
            <label className="label-padrao">
              Dono da conta
              <input
                type="text"
                value={formOwnerCharacterName}
                onChange={(e) => setFormOwnerCharacterName(e.target.value)}
                placeholder="Nome do dono da conta"
                className="campo-input"
              />
            </label>
            <label className="label-padrao">
              % que fica com o serviceiro
              <input
                type="number"
                min={0}
                max={100}
                value={formSharePercent}
                onChange={(e) => setFormSharePercent(e.target.value)}
                placeholder="Ex: 50"
                className="campo-input"
              />
            </label>
          </div>
        )}

        {formError && <span className="texto-perigo" style={{ fontSize: '12px' }}>{formError}</span>}

        <button
          type="submit"
          disabled={saving}
          className="botao-primario"
          style={{ padding: '12px', borderRadius: 'var(--radius)', fontSize: '14px' }}
        >
          {saving ? 'Salvando...' : mode === 'create' ? 'Salvar Membro' : 'Salvar Alterações'}
        </button>
      </form>
    </Modal>
  );
}
