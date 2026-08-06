import { NavLink, Outlet } from 'react-router-dom';
import { useAccount } from '@/hooks/useAccount';
import { BoostedToday } from './BoostedToday';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/loot-log', label: 'Log de Drops', icon: '💎' },
  { to: '/split', label: 'Split Loot', icon: '💰' },
  { to: '/timers', label: 'Timers', icon: '⏱️' },
  { to: '/tier-calculator', label: 'Calculadora Tier', icon: '⚒️' },
  { to: '/charm-planner', label: 'Charm Planner', icon: '🔮' },
  { to: '/calendario', label: 'Histórico', icon: '📅' },
  { to: '/serviceiros', label: 'Serviceiros', icon: '🤝' },
];

export function AppLayout() {
  const { account, loading } = useAccount();

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
            </NavLink>
          ))}
        </nav>
        <BoostedToday />
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
