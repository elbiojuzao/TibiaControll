import { Modal } from '@/components/common/Modal';
import type { SplitLog } from '@/types';
import { SplitDetailContent } from './SplitDetailContent';

/** Modal de detalhes de um split salvo (2026-08-23, pedido do usuário: "ao clicar na linha
 * seria interessante abrir uma modal com as informações mais aprofundadas") — tudo que saiu
 * da tabela resumida do SplitsHistoricoPage (Balance Total/Dano Total/Cura Total) mais o
 * detalhe por jogador (Loot/Supplies/Balance/Dano/Cura), as transferências calculadas e o
 * log bruto colado, pra quem quiser conferir/reprocessar. Não busca nada novo — o `SplitLog`
 * já vem inteiro do useSplitLogsList e é passado inteiro por prop.
 *
 * Extraído de SplitsHistoricoPage.tsx em 2026-08-27 seguindo a regra "modal em arquivo
 * separado" (ver memória feedback-modal-arquivo-separado) — antes estava definida como
 * função-componente inline dentro do arquivo da página.
 *
 * **O corpo virou `SplitDetailContent.tsx` em 2026-09-02** (ver aquele arquivo) — pra
 * reaproveitar no modo calendário do Histórico de Splits, mostrando 2+ splits do mesmo dia
 * lado a lado (SplitsDayModal.tsx) sem duplicar Balance/tabela/log bruto. Este componente
 * virou só a casca `<Modal>` + título; o conteúdo em si mora no outro arquivo. */
export function SplitDetailModal({
  log,
  onClose,
  onDelete,
  deleteError,
}: {
  log: SplitLog;
  onClose: () => void;
  onDelete: () => void;
  deleteError: string | null;
}) {
  return (
    <Modal title={`${log.type === 'boss' ? '🐲 Boss' : '🗡️ Hunt'} — ${log.date}`} onClose={onClose} maxWidth={680}>
      <SplitDetailContent log={log} onDelete={onDelete} deleteError={deleteError} />
    </Modal>
  );
}
