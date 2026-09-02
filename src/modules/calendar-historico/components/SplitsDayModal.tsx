import { Modal } from '@/components/common/Modal';
import type { SplitLog } from '@/types';
import { SplitDetailContent } from './SplitDetailContent';

interface SplitsDayModalProps {
  dateKey: string;
  /** SplitLog completo (não SplitRow) — precisa de members/transfers/rawLog pro
   * SplitDetailContent renderizar cada painel. */
  splits: SplitLog[];
  onClose: () => void;
  onDeleteSplit: (log: SplitLog) => void;
  deleteError: string | null;
}

/** Dia com mais de 1 split no modo calendário do Histórico de Splits (2026-09-02) — pedido
 * do usuário: "a tela que abre com splits de (data) seria bom abrir os dois splits ja
 * abertos um ao lado do outro (sem a parte de pagamento apenas os detalhes separados)".
 * Primeira versão (SplitsDayListModal.tsx, removida) era só uma lista clicável que abria o
 * SplitDetailModal completo num 2º passo — virou isso: cada split já abre expandido, lado a
 * lado (grid responsivo), reaproveitando SplitDetailContent com `showTransfers={false}` (a
 * seção "Transferências"/comandos de pagamento não faz sentido dobrada quando o usuário só
 * quer comparar os detalhes dos 2 splits do dia). Dia com só 1 split não passa por aqui —
 * SplitsHistoricoPage.tsx pula direto pro SplitDetailModal normal (com transferências). */
export function SplitsDayModal({ dateKey, splits, onClose, onDeleteSplit, deleteError }: SplitsDayModalProps) {
  return (
    <Modal title={`Splits de ${dateKey}`} onClose={onClose} maxWidth={1000}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        {splits.map((log) => (
          <div key={log.id}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: log.type === 'boss' ? 'var(--color-accent)' : 'var(--color-warning)' }}>
              {log.type === 'boss' ? '🐲 Boss' : '🗡️ Hunt'}
            </h4>
            <SplitDetailContent
              log={log}
              onDelete={() => onDeleteSplit(log)}
              deleteError={deleteError}
              showTransfers={false}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}
