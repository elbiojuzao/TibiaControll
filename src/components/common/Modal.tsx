import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Largura máxima do card — default 560px (.modal-card no CSS). Formulários com mais
   * campos (ex: DropFormModal) podem passar um valor maior pra não ficar apertado. */
  maxWidth?: number;
  /** Quando true, fechar pelo X ou clicando fora pede confirmação antes de sair
   * (2026-08-26, pedido do usuário: "ao tentar sair de qualquer modal que tenha sido feita
   * uma alteração sem salvar, confirmar se quer realmente sair"). Fechar pelo próprio
   * onClose() do form (ex: depois de salvar com sucesso) não passa por aqui — só X/overlay. */
  isDirty?: boolean;
}

export function Modal({ title, onClose, children, maxWidth, isDirty }: ModalProps) {
  const handleClose = () => {
    if (isDirty && !window.confirm('Você tem alterações não salvas. Deseja realmente sair?')) return;
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={handleClose} title="Fechar" aria-label="Fechar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
