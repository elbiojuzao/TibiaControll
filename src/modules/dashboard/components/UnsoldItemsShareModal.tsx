import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { getItemIconUrl } from '@/services/lootdrop/item-icons';
import { formatGoldKK } from '@/services/common/gold-format';
import { guessItemIcon } from '../utils/loot-visuals';

interface UnsoldItem {
  itemName: string;
  count: number;
  totalValue: number;
}

interface UnsoldItemsShareModalProps {
  items: UnsoldItem[];
  onClose: () => void;
}

interface MessageFormat {
  showQuantity: boolean;
  showIcon: boolean;
  bold: boolean;
  italic: boolean;
  showPrice: boolean;
}

const DEFAULT_FORMAT: MessageFormat = {
  showQuantity: true,
  showIcon: true,
  bold: true,
  italic: false,
  showPrice: false,
};

// Preferência de formato persiste em localStorage (2026-08-19, pedido do usuário: "a
// personalização da mensagem seria legal ficar salvo... cada um ter o seu tipo de
// mensagem") — puramente client-side, mesmo padrão já usado pra Cotação TC do Split Loot.
const FORMAT_STORAGE_KEY = 'tibia-pts:unsold-share-format';

function readStoredFormat(): MessageFormat {
  try {
    const raw = localStorage.getItem(FORMAT_STORAGE_KEY);
    if (!raw) return DEFAULT_FORMAT;
    return { ...DEFAULT_FORMAT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FORMAT;
  }
}

function writeStoredFormat(format: MessageFormat): void {
  try {
    localStorage.setItem(FORMAT_STORAGE_KEY, JSON.stringify(format));
  } catch {
    // localStorage indisponível (aba anônima, quota cheia etc.) — segue sem persistir
  }
}

/** Notação "kk" da comunidade Tibia pro preço na mensagem (2026-08-19, pedido do usuário:
 * "trabalhar com kks a cada mil trocar os 3 zeros por 1 K, exemplo 500000000 seriam 500kk
 * e 1000000 seria 1kk") — usada aqui na mensagem de anúncio pro WhatsApp e no gráfico de
 * tendência mensal do Dashboard (MonthlyTrendModal, 2026-08-21); o resto do app (Split
 * Loot, comandos `transfer`, os próprios cards de KPI) continua usando formatTibiaGold()
 * com o valor por extenso, onde precisão exata importa. Implementação compartilhada em
 * services/common/gold-format.ts. */

function formatItemLine(item: UnsoldItem, fmt: MessageFormat): string {
  let name = item.itemName || 'Item Raro';
  if (fmt.bold) name = `*${name}*`;
  if (fmt.italic) name = `_${name}_`;

  // Ícone por tipo de item (2026-08-19, pedido do usuário: "os icones serem diferentes
  // para cada tipo de item") — reaproveita guessItemIcon() de loot-visuals.ts, o mesmo
  // mapa de palavra-chave→emoji já usado como fallback visual na tabela de drops (anel,
  // elmo, arma, armadura etc.). Não é o sprite real do item — mensagem de texto puro do
  // WhatsApp não carrega imagem embutida —, mas pelo menos varia por categoria em vez de
  // um bullet genérico igual pra tudo.
  const icon = guessItemIcon(item.itemName);
  let line = fmt.showIcon ? `${icon} ${name}` : name;
  if (fmt.showQuantity && item.count > 1) line += ` x${item.count}`;
  if (fmt.showPrice && item.totalValue > 0) line += ` — ${formatGoldKK(item.totalValue)}`;
  return line;
}

/** Monta a mensagem de anúncio (formatação estilo WhatsApp, negrito e itálico incluídos —
 * toda personalizável, 2026-08-19 pedido do usuário: "botões para personalizar a
 * mensagem... mostrar ou não a quantidade... icone ou não bold italico preço"). */
function buildUnsoldItemsMessage(items: UnsoldItem[], fmt: MessageFormat): string {
  if (items.length === 0) return '';
  const header = items.length === 1 ? '🛒 Item à venda:' : '🛒 Itens à venda:';
  const lines = [header, '', ...items.map((i) => formatItemLine(i, fmt))];
  return lines.join('\n');
}

const FORMAT_TOGGLES: { key: keyof MessageFormat; label: string }[] = [
  { key: 'showQuantity', label: 'Quantidade' },
  { key: 'showIcon', label: 'Ícone' },
  { key: 'bold', label: 'Negrito' },
  { key: 'italic', label: 'Itálico' },
  { key: 'showPrice', label: 'Preço' },
];

/** Modal aberta pelo botão "📋 Copiar" do card "TODOS os Itens não vendidos" (2026-08-19,
 * pedido do usuário) — deixa escolher quais itens entram no anúncio de venda (nem sempre
 * quer anunciar TUDO que está pendente de uma vez) e gera a mensagem pronta pra copiar. */
export function UnsoldItemsShareModal({ items, onClose }: UnsoldItemsShareModalProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map((i) => i.itemName)));
  const [format, setFormat] = useState<MessageFormat>(readStoredFormat);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedItems = useMemo(() => items.filter((i) => selected.has(i.itemName)), [items, selected]);

  // Mensagem sincroniza com a seleção e com as opções de formato — editar manualmente é
  // permitido (mesmo padrão do aviso de venda em DropFormModal.tsx), mas trocar seleção ou
  // formato regenera do zero.
  useEffect(() => {
    setMessage(buildUnsoldItemsMessage(selectedItems, format));
    setCopied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, format]);

  const toggleItem = (itemName: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemName)) next.delete(itemName);
      else next.add(itemName);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((i) => i.itemName))));
  };

  const toggleFormat = (key: keyof MessageFormat) => {
    setFormat((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeStoredFormat(next);
      return next;
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
  };

  return (
    <Modal title="Anunciar itens à venda" onClose={onClose}>
      <div className="form-coluna">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="form-section-title" style={{ margin: 0, padding: 0, border: 'none' }}>
              Itens ({selected.size}/{items.length} selecionados)
            </span>
            <button type="button" onClick={toggleAll} className="botao-secundario" style={{ padding: '4px 10px', fontSize: '12px' }}>
              {selected.size === items.length ? 'Desmarcar todos' : 'Marcar todos'}
            </button>
          </div>
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {items.map((item) => {
              const iconUrl = getItemIconUrl(item.itemName);
              return (
                <label
                  key={item.itemName}
                  className="label-checkbox"
                  style={{ padding: '6px 4px', borderBottom: '1px solid var(--color-bg-elevated)' }}
                >
                  <input type="checkbox" checked={selected.has(item.itemName)} onChange={() => toggleItem(item.itemName)} />
                  {iconUrl
                    ? <img src={iconUrl} alt="" className="h20 w20" style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                    : <span className="w20" style={{ flexShrink: 0 }} />}
                  <span style={{ flex: 1, color: 'var(--color-text)', fontSize: '13px' }}>{item.itemName || 'Item Raro'}</span>
                  <span style={{ color: 'var(--color-warning)', fontSize: '13px', fontWeight: 'bold' }}>x{item.count}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <span className="form-section-title" style={{ display: 'block', marginBottom: '8px' }}>Personalizar mensagem</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {FORMAT_TOGGLES.map(({ key, label }) => {
              const active = format[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFormat(key)}
                  style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px',
                    border: active ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
                    background: active ? 'var(--color-success-soft)' : 'var(--color-bg-input)',
                    color: active ? 'var(--color-success)' : 'var(--color-text-muted)',
                  }}
                >
                  {active ? '✓ ' : ''}{label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="label-padrao">
          Mensagem
          <textarea
            rows={Math.max(4, selectedItems.length + 3)}
            value={message}
            onChange={(e) => { setMessage(e.target.value); setCopied(false); }}
            className="campo-input texto-mono"
            style={{ fontSize: '13px', resize: 'vertical' }}
          />
        </label>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!message.trim()}
          className="botao-primario"
          style={{ padding: '12px', borderRadius: 'var(--radius)', fontSize: '14px', background: copied ? 'var(--color-success)' : undefined }}
        >
          {copied ? '✓ Copiado' : '📋 Copiar Mensagem'}
        </button>
      </div>
    </Modal>
  );
}
