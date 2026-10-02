/** Esqueleto do Dashboard enquanto a conta carrega (2026-10-02, pedido do usuário) — no lugar
 * do texto "Carregando...". Mesma grade de 3 colunas e mesma ordem de blocos da página real
 * (Drops no mês | KPIs + membros | Não vendidos + Top Drop), pra a transição não "pular". */
export function DashboardSkeleton() {
  return (
    <div className="dashboard-container" style={{ padding: '4px 20px 20px', maxWidth: '1700px', margin: '0 auto' }} aria-busy="true" aria-label="Carregando Dashboard">
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.1fr 1.1fr', gap: '20px' }}>
        <div className="skeleton" style={{ height: '520px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {Array.from({ length: 10 }, (_, i) => <div key={i} className="skeleton" style={{ height: '52px' }} />)}
          </div>
          <div className="skeleton" style={{ height: '56px' }} />
          <div className="skeleton" style={{ height: '380px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="skeleton" style={{ height: '300px' }} />
          <div className="skeleton" style={{ height: '200px' }} />
        </div>
      </div>
    </div>
  );
}
