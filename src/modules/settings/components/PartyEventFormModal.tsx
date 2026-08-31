import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { brToIso, isoToBr } from '@/services/common/br-date';
import { PARTY_EVENT_CATEGORIES, PARTY_EVENT_CATEGORY_ICON, PARTY_EVENT_CATEGORY_LABEL } from '@/services/party-events/party-event-display';
import type { CreatePartyEventDto, PartyEvent, PartyEventCategory } from '@/types';

interface PartyEventFormModalProps {
  mode: 'create' | 'edit';
  /** Obrigatório quando mode === 'edit' */
  event?: PartyEvent;
  onClose: () => void;
  onSubmit: (dto: CreatePartyEventDto) => Promise<unknown>;
}

/** Relação real do jogo entre os tipos (2026-08-25, pedido do usuário: "todo evendo de
 * drouble xp tambem é double skill mas nem todos os double skill é double xp") — Double XP
 * SEMPRE vem junto com Double Skill (invariante do jogo), mas o contrário não é verdade:
 * Double Skill pode acontecer sozinho ou junto de Rapid Respawn, sem Double XP. Marcar
 * Double XP força Double Skill junto; tentar desmarcar Double Skill enquanto Double XP
 * está marcado é bloqueado (não daria pra ter um sem o outro nesse sentido). */
function toggleCategory(list: PartyEventCategory[], cat: PartyEventCategory): PartyEventCategory[] {
  const active = list.includes(cat);
  if (active) {
    if (cat === 'double_skill' && list.includes('double_xp')) return list; // bloqueado — ver doc acima
    return list.filter((c) => c !== cat);
  }
  if (cat === 'double_xp' && !list.includes('double_skill')) {
    return [...list, cat, 'double_skill'];
  }
  return [...list, cat];
}

/** Modal de "Novo Evento" (2026-08-25, pedido do usuário: "o botao de adicionar novo
 * evento que abre a modal e o usuario vai digitar sobre o evento e cadastrar") — mesmo
 * padrão de formulário-em-modal já usado no resto do app (ver
 * ServiceiroFormModal/DropFormModal/MemberFormModal). Data fim é opcional no campo — se
 * ficar em branco, assume igual à data início (evento de 1 dia só). **Tipo do evento**
 * (2026-08-25, refinamento seguinte, pedido do usuário: "a modal de evento tem que ter o
 * tipo do evento") — multi-select por toggle buttons (mesmo padrão de vocações do
 * ServiceiroFormModal), lista fixa confirmada com o usuário: Double XP/Rapid
 * Respawn/Exaltation Forge/Double Skill, pode marcar mais de 1 ao mesmo tempo.
 *
 * **Movido do Calendário pra Configurações em 2026-08-28** (pedido do usuário: "o
 * adicionar evento tem que ser em configurações... ele vai adicionar para todas as
 * contas e não apenas para a party" — na prática o evento já era isolado por
 * account_id/RLS desde a migration original, mas o usuário preferiu deixar a *criação*
 * fora do Calendário, que passa a ser só exibição/leitura dos eventos). O evento
 * continua compartilhado com a conta/PT inteira (não é por login individual), só a
 * localização do botão mudou. Ver [[modulo-eventos-party]].
 *
 * **Reutilizada pra editar em 2026-08-31** (pedido do usuário: "podemos reutilizar [a
 * modal] para excluir um evento ou editar evento") — mesmo padrão de `MemberFormModal`
 * (`mode: 'create' | 'edit'` + prop `event` obrigatória no modo edit). Exclusão não passa
 * por essa modal (é direto na lista com `window.confirm`, ver SettingsPage.tsx), só edição. */
export function PartyEventFormModal({ mode, event, onClose, onSubmit }: PartyEventFormModalProps) {
  const [title, setTitle] = useState(mode === 'edit' ? event!.title : '');
  // Título deixa de ser auto-preenchido assim que o usuário digitar algo nele à mão
  // (2026-08-25, ver handleToggleCategory abaixo) — mesmo padrão de "slug auto-derivado até
  // edição manual" já comum em formulários. No modo edit já nasce "touched" (o título já
  // existe de verdade, não deve ser sobrescrito só por mexer nos tipos).
  const [titleTouched, setTitleTouched] = useState(mode === 'edit');
  const [description, setDescription] = useState(mode === 'edit' ? event!.description : '');
  const [startDate, setStartDate] = useState(mode === 'edit' ? brToIso(event!.startDate) : '');
  const [endDate, setEndDate] = useState(mode === 'edit' ? brToIso(event!.endDate) : '');
  const [categories, setCategories] = useState<PartyEventCategory[]>(mode === 'edit' ? event!.categories : []);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmação ao sair sem salvar (2026-08-26, pedido do usuário) — mesmo padrão de
  // DropFormModal: snapshot dos campos na 1ª renderização (= valor inicial, sempre vazio
  // aqui já que esse modal só cria eventos novos) comparado com os valores atuais.
  const [initialSnapshot] = useState(() => JSON.stringify({ title, description, startDate, endDate, categories }));
  const isDirty = JSON.stringify({ title, description, startDate, endDate, categories }) !== initialSnapshot;

  // Título automático a partir do(s) tipo(s) selecionado(s) (2026-08-25, pedido do
  // usuário: "ao selecionar o tipo do evento tem que colocar o titulo automático") — junta
  // os labels na ordem em que aparecem em PARTY_EVENT_CATEGORIES (não na ordem de clique),
  // ex: "Double XP + Double Skill". Só sobrescreve o título enquanto o usuário não tiver
  // editado o campo manualmente.
  const handleToggleCategory = (cat: PartyEventCategory) => {
    const next = toggleCategory(categories, cat);
    setCategories(next);
    if (!titleTouched) {
      setTitle(PARTY_EVENT_CATEGORIES.filter((c) => next.includes(c)).map((c) => PARTY_EVENT_CATEGORY_LABEL[c]).join(' + '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Informe um título pro evento.');
      return;
    }
    if (!startDate) {
      setFormError('Informe a data de início.');
      return;
    }
    const effectiveEnd = endDate || startDate;
    if (effectiveEnd < startDate) {
      setFormError('A data fim não pode ser antes da data início.');
      return;
    }
    if (categories.length === 0) {
      setFormError('Selecione ao menos 1 tipo de evento.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim(),
        startDate: isoToBr(startDate),
        endDate: isoToBr(effectiveEnd),
        categories,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar evento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={mode === 'create' ? 'Novo Evento' : 'Editar Evento'} onClose={onClose} isDirty={isDirty}>
      <form onSubmit={handleSubmit} className="form-coluna">
        <label className="label-padrao">
          Título
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }}
            placeholder="Ex: Guerra contra Fulano (ou selecione um tipo abaixo)"
            className="campo-input"
          />
        </label>

        <label className="label-padrao">
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes do evento (opcional)"
            className="campo-input"
            rows={3}
          />
        </label>

        <div>
          <span className="label-padrao" style={{ display: 'block', marginBottom: '6px' }}>
            Tipo do evento
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PARTY_EVENT_CATEGORIES.map((cat) => {
              const active = categories.includes(cat);
              // Double Skill fica travado (marcado, sem poder desmarcar) enquanto Double XP
              // estiver ativo — ver doc de toggleCategory acima.
              const locked = cat === 'double_skill' && categories.includes('double_xp');
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleToggleCategory(cat)}
                  title={locked ? 'Double Skill vem sempre junto de Double XP' : PARTY_EVENT_CATEGORY_LABEL[cat]}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '13px',
                    cursor: locked ? 'default' : 'pointer',
                    opacity: locked ? 0.75 : 1,
                    border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    background: active ? 'var(--color-accent-soft)' : 'var(--color-bg-input)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  }}
                >
                  <span>{PARTY_EVENT_CATEGORY_ICON[cat]}</span>
                  <span>{PARTY_EVENT_CATEGORY_LABEL[cat]}</span>
                  {locked && <span style={{ fontSize: '10px' }}>🔒</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid-2col">
          <label className="label-padrao">
            Data início
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="campo-input"
            />
          </label>
          <label className="label-padrao">
            Data fim
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              placeholder="Igual à data início, se vazio"
              className="campo-input"
            />
          </label>
        </div>

        {formError && <span className="texto-perigo" style={{ fontSize: '12px' }}>{formError}</span>}

        <button
          type="submit"
          disabled={saving}
          className="botao-primario"
          style={{ padding: '12px', borderRadius: 'var(--radius)', fontSize: '14px' }}
        >
          {saving ? 'Salvando...' : mode === 'create' ? 'Salvar Evento' : 'Salvar Alterações'}
        </button>
      </form>
    </Modal>
  );
}
