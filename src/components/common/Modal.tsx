import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Largura máxima do card — default 560px (.modal-card no CSS). Formulários com mais
   * campos (ex: DropFormModal) podem passar um valor maior pra não ficar apertado. */
  maxWidth?: number;
}

export function Modal({ title, onClose, children, maxWidth }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} title="Fechar" aria-label="Fechar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
