import { Modal } from '@/components/common/Modal';
import { PARTY_EVENT_CATEGORY_ICON, PARTY_EVENT_CATEGORY_LABEL } from '../party-event-display';
import { formatTibiaGold } from '@/services/split';
import type { DayActivity, PartyEvent, TibiaEvent, TibiaEventCategory } from '@/types';
import type { SplitLogDailyEntry } from '@/hooks/useSplitLogsDaily';

const EVENT_CATEGORY_ICON: Record<TibiaEventCategory, string> = {
  rapid_respawn: '🐇',
  xp_boost: '⭐',
  potion_boost: '🧪',
};

const EVENT_CATEGORY_LABEL: Record<TibiaEventCategory, string> = {
  rapid_respawn: 'Rapid Respawn',
  xp_boost: 'Bônus de XP',
  potion_boost: 'Bônus de Poção',
};

function formatXp(value: number): string {
  const sign = value < 0 ? '-' : '+';
  return sign + Math.abs(value).toLocaleString('pt-BR');
}

/** Modal "Detalhes de DD/MM/YYYY" aberta ao clicar num dia do calendário. Reune tudo
 * que aconteceu naquele dia: eventos da party cadastrados pelo usuário, eventos
 * oficiais (rapid respawn/XP/poção), perfil individual de Hunt/Boss (split_logs), XP
 * diária de cada membro (planilha) e os drops registrados.
 *
 * Extraído de CalendarioPage.tsx em 2026-08-27 seguindo a regra "modal em arquivo
 * separado" (ver memória feedback-modal-arquivo-separado) — antes era um bloco
 * `<Modal>` inline no JSX da página (~120 linhas), ocupando boa parte do componente.
 *
 * Como a página precisa manter controle de vários state items (selectedDateKey, hidingType,
 * hideError), algumas props são listas/eventos já computados e funções callback — nada de
 * fetch novo dentro do modal. */
export function CalendarDayDetailsModal({
  dateKey,
  activity,
  partyEvents,
  tibiaEvents,
  splitDaily,
  xpByMember,
  hidingType,
  hideError,
  onClose,
  onHideSplit,
}: {
  dateKey: string;
  activity: DayActivity | undefined;
  partyEvents: PartyEvent[];
  tibiaEvents: TibiaEvent[];
  splitDaily: SplitLogDailyEntry | undefined;
  xpByMember: { name: string; value: number }[];
  hidingType: 'hunt' | 'boss' | null;
  hideError: string | null;
  onClose: () => void;
  onHideSplit: (type: 'hunt' | 'boss') => void;
}) {
  return (
    <Modal title={`Detalhes de ${dateKey}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
        {partyEvents.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-accent)' }}>📌 Evento da party</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {partyEvents.map((ev) => (
                <div key={ev.id} style={{ background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                  <strong style={{ color: 'var(--color-accent)' }}>{ev.title}</strong>
                  <div className="texto-mudo" style={{ fontSize: '11px', margin: '4px 0' }}>
                    {ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} até ${ev.endDate}`}
                    {' · '}
                    {ev.categories.map((cat) => `${PARTY_EVENT_CATEGORY_ICON[cat]} ${PARTY_EVENT_CATEGORY_LABEL[cat]}`).join(' · ')}
                  </div>
                  {ev.description && <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>{ev.description}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tibiaEvents.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-warning)' }}>🚩 Evento oficial</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tibiaEvents.map((ev) => (
                <div key={ev.id} style={{ background: 'var(--color-warning-soft)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                  <strong style={{ color: 'var(--color-warning)' }}>{ev.name}</strong>
                  <div className="texto-mudo" style={{ fontSize: '12px', margin: '4px 0' }}>
                    {ev.categories.map((cat) => `${EVENT_CATEGORY_ICON[cat]} ${EVENT_CATEGORY_LABEL[cat]}`).join(' · ')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>{ev.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Boss/Hunt: soma de "Cota por Membro" dos splits salvos nesse dia
            (split_logs, ver useSplitLogsDaily) — cada caixa checa o próprio campo
            (null == nenhum split desse tipo salvo nesse dia), independente uma da outra
            (um dia pode ter só Hunt salvo, só Boss, os dois, ou nenhum). */}
        <div className="grid-2col" style={{ gap: '10px' }}>
          <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', display: 'block' }}>Boss (individual)</span>
              {splitDaily?.boss != null && (
                <button
                  type="button"
                  onClick={() => onHideSplit('boss')}
                  disabled={hidingType === 'boss'}
                  title="Excluir split de Boss desse dia"
                  className="botao-icone-perigo"
                  style={{ fontSize: '12px' }}
                >
                  🗑️
                </button>
              )}
            </div>
            <strong style={{ color: splitDaily?.boss != null ? (splitDaily.boss < 0 ? 'var(--color-danger)' : 'var(--color-success)') : 'var(--color-text-faint)' }}>
              {splitDaily?.boss != null ? formatXp(splitDaily.boss) : 'Sem dado'}
            </strong>
          </div>
          <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', display: 'block' }}>Hunt (individual)</span>
              {splitDaily?.hunt != null && (
                <button
                  type="button"
                  onClick={() => onHideSplit('hunt')}
                  disabled={hidingType === 'hunt'}
                  title="Excluir split de Hunt desse dia"
                  className="botao-icone-perigo"
                  style={{ fontSize: '12px' }}
                >
                  🗑️
                </button>
              )}
            </div>
            <strong style={{ color: splitDaily?.hunt != null ? (splitDaily.hunt < 0 ? 'var(--color-danger)' : 'var(--color-success)') : 'var(--color-text-faint)' }}>
              {splitDaily?.hunt != null ? formatXp(splitDaily.hunt) : 'Sem dado'}
            </strong>
          </div>
        </div>
        {hideError && <span className="texto-perigo" style={{ fontSize: '12px' }}>⚠ {hideError}</span>}

        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-accent)' }}>XP do dia</h4>
          {xpByMember.length === 0 ? (
            <p className="texto-fraco" style={{ fontSize: '12px', margin: 0 }}>Sem dado de XP pra esse dia.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {xpByMember.map(({ name, value }) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text)' }}>{name}</span>
                  <strong style={{ color: value < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatXp(value)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="texto-sucesso" style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Drops</h4>
          {(activity?.drops.length ?? 0) === 0 ? (
            <p className="texto-fraco" style={{ fontSize: '12px', margin: 0 }}>Nenhum drop registrado nesse dia.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activity!.drops.map((drop) => (
                <div key={drop.id} style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
                  💎 {drop.itemName} <span className="texto-fraco">({drop.bossName})</span><br />
                  Valor: <strong className="texto-sucesso">{formatTibiaGold(drop.totalValue)}</strong>{' '}
                  · {drop.sold ? 'Vendido' : 'Pendente'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
