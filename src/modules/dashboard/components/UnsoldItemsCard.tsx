import { getItemIconUrl } from '@/services/lootdrop/item-icons';

export interface UnsoldGroupedItem {
  itemName: string;
  count: number;
  totalValue: number;
}

interface UnsoldItemsCardProps {
  items: UnsoldGroupedItem[];
  /** Qtd total de drops não vendidos (pode ser maior que items.length — este é agrupado
   * por nome de item, aquele é a contagem "crua"). */
  totalCount: number;
  loading: boolean;
  error: string | null;
  onShareClick: () => void;
}

/** Card "TODOS os Itens não vendidos" do Dashboard (Coluna 3) — extraído em 2026-08-27 pra
 * reduzir o tamanho de DashboardPage.tsx (ver memória "componentes-grandes"). Só
 * apresentação: agrupamento por item já vem pronto por props; o botão de compartilhar só
 * dispara onShareClick (abre o UnsoldItemsShareModal, que continua sendo chamado só na
 * página, ver [[feedback-modal-arquivo-separado]]). */
export function UnsoldItemsCard({ items, totalCount, loading, error, onShareClick }: UnsoldItemsCardProps) {
  return (
    <div className="card-compacto" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
        <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--color-warning)' }}>TODOS os Itens não vendidos</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {items.length > 0 && (
            <button
              type="button"
              onClick={onShareClick}
              title="Compartilhar itens à venda"
              className="botao-icone"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" fill="currentColor" stroke="none" />
                <circle cx="6" cy="12" r="3" fill="currentColor" stroke="none" />
                <circle cx="18" cy="19" r="3" fill="currentColor" stroke="none" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          )}
          <span style={{ fontSize: '12px', background: 'var(--color-bg-input)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
            Qtd: {totalCount}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {loading && <div className="texto-mudo" style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>Carregando...</div>}
        {error && <div className="texto-perigo" style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <p className="estado-vazio">Nenhum item pendente no momento.</p>
        )}
        {!loading && !error && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {items.map((item) => {
              const iconUrl = getItemIconUrl(item.itemName);
              return (
                <div key={item.itemName} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px', borderBottom: '1px solid var(--color-bg-elevated)' }}>
                  {iconUrl
                    ? <img src={iconUrl} alt="" className="h20 w20" style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                    : <span className="w20" style={{ flexShrink: 0 }} />}
                  <span className="texto-mudo" style={{ fontSize: '13px', flex: 1 }}>{item.itemName || 'Item Raro'}</span>
                  <span style={{ color: 'var(--color-warning)', fontSize: '13px', fontWeight: 'bold' }}>x{item.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
