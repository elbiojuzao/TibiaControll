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
  { to: '/configuracoes', label: 'Configurações', icon: '⚙️', gated: true },
];

export function AppLayout() {
  const { account, loading } = useAccount();
  const { isAuthenticated, logout } = useAuth();

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Tibia PT Manager</h1>
          <span>{account?.partyName ?? 'Party'}</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
              {/* Cadeado indica módulo exclusivo de conta pra quem não logou ainda —
                  clicar leva pro /login normalmente (RequireAuth cuida disso). */}
              {item.gated && !isAuthenticated && (
                <span title="Exige login" style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.6 }}>🔒</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #334155' }}>
          {isAuthenticated ? (
            <button
              onClick={() => logout()}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '8px',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🚪 Sair
            </button>
          ) : (
            <NavLink
              to="/login"
              style={{
                display: 'block',
                textAlign: 'center',
                background: 'transparent',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '8px',
                color: '#10b981',
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              🔑 Entrar
            </NavLink>
          )}
        </div>

        <BoostedToday />
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
