import { NavLink, Outlet } from 'react-router-dom';
import { useAccount } from '@/hooks/useAccount';
import { useAuth } from '@/hooks/useAuth';
import { BoostedToday } from './BoostedToday';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', gated: true },
  { to: '/loot-log', label: 'Log de Drops', icon: '💎', gated: true },
  { to: '/split', label: 'Split Loot', icon: '💰', gated: false },
  { to: '/timers', label: 'Timers', icon: '⏱️', gated: false },
  { to: '/tier-calculator', label: 'Calculadora Tier', icon: '⚒️', gated: false },
  { to: '/charm-planner', label: 'Charm Planner', icon: '🔮', gated: false },
  { to: '/calendario', label: 'Histórico', icon: '📅', gated: true },
  { to: '/historico-xp', label: 'Histórico de XP', icon: '📈', gated: true },
  { to: '/serviceiros', label: 'Serviceiros', icon: '🤝', gated: true },
  // Configurações (2026-08-16) mora só no menu do avatar, não duplica aqui no nav.
];

/** Iniciais pro avatar circular da topbar — nome da party, não do usuário
 * individual (login é compartilhado pela PT inteira, ver [[regras_gestao_pts]]). */
function partyInitial(partyName: string | undefined): string {
  return partyName?.trim()?.[0]?.toUpperCase() ?? 'P';
}

export function AppLayout() {
  const { account, loading } = useAccount();
  const { isAuthenticated, logout } = useAuth();

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="topbar-brand-icon">🐉</span>
          <div>
            <h1>Tibia PT Manager</h1>
            <span>{account?.partyName ?? 'Party'}</span>
          </div>
        </div>

        <nav className="topbar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-link-icon">
                {item.icon}
                {/* Cadeado indica módulo exclusivo de conta pra quem não logou ainda —
                    clicar leva pro /login normalmente (RequireAuth cuida disso). */}
                {item.gated && !isAuthenticated && (
                  <span title="Exige login" className="nav-link-lock">🔒</span>
                )}
              </span>
              <span className="nav-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <BoostedToday />
          <div className="avatar-trigger">
            <button type="button" className="avatar" title={account?.partyName ?? 'Party'} aria-label="Menu da conta">
              {partyInitial(account?.partyName)}
            </button>
            <div className="avatar-panel">
              <NavLink to="/configuracoes" className="avatar-panel-item">
                ⚙️ Configurações
              </NavLink>
              {isAuthenticated ? (
                <button type="button" className="avatar-panel-item" onClick={() => logout()}>
                  🚪 Sair
                </button>
              ) : (
                <NavLink to="/login" className="avatar-panel-item">
                  🔑 Entrar
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
