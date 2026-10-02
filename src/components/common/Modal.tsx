import { useEffect, useRef } from 'react';
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

/** Duração da saída — mantida em sincronia com `.modal-saindo` em global.css. */
const EXIT_MS = 150;

/** Animação de FECHAR (2026-10-02, pedido do usuário: "animação ao abrir e fechar modal,
 * aplicar pra todas"). As páginas desmontam o modal na hora (`{aberto && <XModal/>}`) e vários
 * fechamentos acontecem fora do Modal (form chamando onClose() depois de salvar, botão
 * Cancelar) — então não dá pra atrasar o unmount aqui dentro. Em vez disso, no unmount deixa
 * uma CÓPIA visual do overlay no <body> que faz o fade-out e se remove sozinha. Vale pra
 * qualquer caminho de fechamento, sem tocar nos 12 modais. A cópia é só imagem: inerte, sem
 * ids duplicados, com os valores dos campos copiados (cloneNode não leva o `value` vivo). */
function playExitAnimation(overlay: HTMLElement) {
  const ghost = overlay.cloneNode(true) as HTMLElement;

  const liveFields = overlay.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');
  const ghostFields = ghost.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');
  liveFields.forEach((field, i) => {
    const copy = ghostFields[i];
    if (!copy) return;
    if (field instanceof HTMLSelectElement && copy instanceof HTMLSelectElement) {
      copy.selectedIndex = field.selectedIndex;
    } else if (field instanceof HTMLInputElement && copy instanceof HTMLInputElement) {
      copy.value = field.value;
      copy.checked = field.checked;
    } else {
      copy.value = field.value;
    }
  });

  ghost.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  ghost.setAttribute('aria-hidden', 'true');
  ghost.setAttribute('inert', '');
  ghost.classList.add('modal-saindo');
  document.body.appendChild(ghost);

  const remove = () => ghost.remove();
  ghost.addEventListener('animationend', (e) => {
    if (e.target === ghost) remove();
  });
  window.setTimeout(remove, EXIT_MS + 250);
}

export function Modal({ title, onClose, children, maxWidth, isDirty }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    return () => {
      // `isConnected` ainda é true no "unmount simulado" do StrictMode (dev) — aí não é
      // fechamento de verdade e não pode deixar cópia. No unmount real o nó já saiu do DOM.
      if (!overlay || overlay.isConnected) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      playExitAnimation(overlay);
    };
  }, []);

  const handleClose = () => {
    if (isDirty && !window.confirm('Você tem alterações não salvas. Deseja realmente sair?')) return;
    onClose();
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={handleClose}>
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
