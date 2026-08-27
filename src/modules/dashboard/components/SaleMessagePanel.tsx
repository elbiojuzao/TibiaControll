interface SaleMessagePanelProps {
  message: string;
  copied: boolean;
  onMessageChange: (value: string) => void;
  onCopy: () => void;
}

/** Painel "Avisar a venda no WhatsApp" do DropFormModal — extraído em 2026-08-27 pra
 * reduzir o tamanho do componente (ver memória "componentes-grandes"). Só apresentação: a
 * mensagem padrão (buildSaleMessage) e o estado de "já copiado" continuam no componente
 * pai; aqui só o textarea editável + botão de copiar. */
export function SaleMessagePanel({ message, copied, onMessageChange, onCopy }: SaleMessagePanelProps) {
  return (
    <div className="card-compacto">
      <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--color-text)' }}>Avisar a venda no WhatsApp:</h4>
      <textarea
        rows={8}
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        className="campo-input texto-mono"
        style={{ marginTop: 0, fontSize: '12px', resize: 'vertical' }}
      />
      <button
        type="button"
        onClick={onCopy}
        className="botao-primario"
        style={{ marginTop: '8px', background: copied ? 'var(--color-success)' : undefined }}
      >
        {copied ? '✓ Copiado' : '📋 Copiar Mensagem'}
      </button>
    </div>
  );
}
