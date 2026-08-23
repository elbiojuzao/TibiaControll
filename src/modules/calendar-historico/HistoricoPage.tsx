import { useSearchParams } from 'react-router-dom';
import { CalendarioPage } from './CalendarioPage';
import { SplitsHistoricoPage } from './SplitsHistoricoPage';
import { XpHistoricoPage } from '@/modules/xp-historico';

type HistoricoTab = 'calendario' | 'xp' | 'splits';

const TABS: { key: HistoricoTab; label: string; icon: string }[] = [
  { key: 'calendario', label: 'Calendário', icon: '📅' },
  { key: 'xp', label: 'XP', icon: '📈' },
  { key: 'splits', label: 'Splits', icon: '🧾' },
];

/** Página guarda-chuva "Histórico" (2026-08-21, pedido do usuário: "ajeitarmos o
 * historico, fazer com que o historico de xp seja uma aba dentro de historico... uma
 * maneira de filtrar os splits"). Antes eram 2 rotas/itens de nav separados (/calendario
 * e /historico-xp) — viraram abas de uma página só, mais uma aba nova "Splits". Estado da
 * aba ativa vive na URL (`?tab=`), não em state local — permite deep-link direto (usado
 * pelo botão "🧾 Histórico de Splits" da Calculadora de Split Loot, que navega pra
 * `/calendario?tab=splits`). CalendarioPage/XpHistoricoPage tiveram seus próprios
 * wrapper+header removidos (eram rotas standalone antes) — agora só retornam o conteúdo,
 * o header/wrapper únicos ficam aqui. */
export function HistoricoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: HistoricoTab = TABS.some((t) => t.key === tabParam) ? (tabParam as HistoricoTab) : 'calendario';

  const goToTab = (tab: HistoricoTab) => {
    setSearchParams(tab === 'calendario' ? {} : { tab });
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1300px', margin: '0 auto', color: 'var(--color-text)' }}>
      <header className="page-header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-success)' }}>Histórico</h2>
        <p className="subtitulo-pagina">Calendário de atividade, evolução de XP e splits salvos.</p>
      </header>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => goToTab(tab.key)}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
              border: activeTab === tab.key ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: activeTab === tab.key ? 'var(--color-accent-soft)' : 'var(--color-bg-input)',
              color: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'calendario' && <CalendarioPage />}
      {activeTab === 'xp' && <XpHistoricoPage />}
      {activeTab === 'splits' && <SplitsHistoricoPage />}
    </div>
  );
}
