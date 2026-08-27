import { formatTibiaGold } from '@/services/split';

export interface TopDropEntry {
  looter: string;
  totalValue: number;
  dropCount: number;
}

interface TopDropCardProps {
  ranking: TopDropEntry[];
  loading: boolean;
  onPlayerClick: (looter: string) => void;
}

/** Card "Top Drop" do Dashboard (Coluna 3) — extraído em 2026-08-27 pra reduzir o tamanho
 * de DashboardPage.tsx (ver memória "componentes-grandes"). Só apresentação: o ranking já
 * vem calculado por props; clicar num jogador só dispara onPlayerClick (abre o
 * PlayerDropsModal, que continua sendo chamado só na página, ver
 * [[feedback-modal-arquivo-separado]]). */
export function TopDropCard({ ranking, loading, onPlayerClick }: TopDropCardProps) {
  return (
    <div className="card-compacto">
      <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: 'var(--color-accent)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Top Drop</h3>
      <span className="texto-fraco" style={{ fontSize: '11px', display: 'block', marginBottom: '8px', marginTop: '-6px' }}>Últimos 365 dias</span>
      {loading && <div className="texto-mudo" style={{ fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Carregando...</div>}
      {!loading && ranking.length === 0 && (
        <div className="texto-fraco" style={{ fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          Nenhum drop com fragador nos últimos 365 dias.
        </div>
      )}
      {!loading && ranking.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ranking.map((entry, idx) => (
            <div key={entry.looter} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px', borderBottom: '1px solid var(--color-bg-elevated)' }}>
              <span className="h22 w22" style={{
                borderRadius: 'var(--radius-pill)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 'bold',
                background: idx === 0 ? 'var(--color-warning)' : idx === 1 ? 'var(--color-text-muted)' : idx === 2 ? '#b45309' : 'var(--color-border)',
                color: idx <= 2 ? 'var(--color-bg)' : 'var(--color-text-muted)',
              }}>
                {idx + 1}
              </span>
              <span
                className="texto-mudo"
                onClick={() => onPlayerClick(entry.looter)}
                title="Ver todos os drops deste jogador"
                style={{ flex: 1, fontSize: '13px', cursor: 'pointer' }}
              >
                {entry.looter}
              </span>
              <span style={{ textAlign: 'right' }}>
                <span className="texto-sucesso" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>
                  {formatTibiaGold(entry.totalValue)}
                </span>
                <span className="texto-fraco" style={{ display: 'block', fontSize: '11px' }}>
                  {entry.dropCount} {entry.dropCount === 1 ? 'drop' : 'drops'}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
