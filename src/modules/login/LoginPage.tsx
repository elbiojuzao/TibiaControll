import { Navigate, useLocation, useSearchParams, type Location } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { getItemIconUrl } from '@/services/lootdrop/item-icons';

type AuthMode = 'entrar' | 'cadastro';

const MODES: { key: AuthMode; label: string }[] = [
  { key: 'entrar', label: 'Entrar' },
  { key: 'cadastro', label: 'Criar conta' },
];

const BAG_YOU_DESIRE_ICON = getItemIconUrl('Bag You Desire');

const HIGHLIGHTS: { icon: string; iconUrl?: string; title: string; text: string }[] = [
  { icon: '💰', title: 'Split de loot', text: 'Divisão justa entre a party, com serviceiros e gastos extras.' },
  { icon: '📈', title: 'Histórico e XP', text: 'Calendário de atividade e evolução de XP de cada membro.' },
  { icon: '🐉', iconUrl: BAG_YOU_DESIRE_ICON, title: 'Drops e bosses', text: 'Log de drops, timers de boss e agenda de serviceiros.' },
];

/** Tela única de entrar + criar conta (2026-10-05, pedido do usuário). Cada conta é uma
 * party: o e-mail/senha é compartilhado por todos os membros daquela party (ver memória
 * "regras-gestao-pts"), e o isolamento entre parties é feito por RLS no banco. Só protege
 * os módulos exclusivos de conta (Dashboard, Log de Drops, Histórico, Serviceiros...) — o
 * resto do app (Split Loot, Timers, Calculadora Tier, Charm Planner) segue aberto sem
 * login. O modo ativo vive na URL (`?modo=cadastro`) pra poder linkar direto pro cadastro. */
export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: AuthMode = searchParams.get('modo') === 'cadastro' ? 'cadastro' : 'entrar';

  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/';

  if (isAuthenticated) return <Navigate to={from} replace />;

  const goToMode = (next: AuthMode) => setSearchParams(next === 'entrar' ? {} : { modo: next }, { replace: true, state: location.state });

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-logo">⚔️</div>
        <h1 className="auth-brand-title">Tibia PT Manager</h1>
        <p className="auth-brand-subtitle">Tudo da sua party num lugar só — loot, bosses, XP e serviceiros.</p>
        <ul className="auth-highlights">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title}>
              <span className="auth-highlight-icon">
                {item.iconUrl ? <img src={item.iconUrl} alt="" width={28} height={28} style={{ imageRendering: 'pixelated' }} /> : item.icon}
              </span>
              <span>
                <strong>{item.title}</strong>
                <span className="texto-mudo">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="auth-card">
        <div className="auth-mobile-brand">
          <span className="auth-logo auth-logo-small">⚔️</span>
          <strong>Tibia PT Manager</strong>
        </div>

        <div className="auth-tabs" role="tablist">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={mode === m.key}
              className={`auth-tab${mode === m.key ? ' auth-tab-active' : ''}`}
              onClick={() => goToMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="auth-heading">
          <h2>{mode === 'entrar' ? 'Bem-vindo de volta' : 'Crie a conta da sua party'}</h2>
          <p className="texto-mudo">
            {mode === 'entrar'
              ? 'Entre com o e-mail e a senha da sua party pra acessar Dashboard, Drops, Histórico e Serviceiros.'
              : 'Leva menos de um minuto. Depois é só cadastrar os membros em Configurações.'}
          </p>
        </div>

        {mode === 'entrar' ? <LoginForm /> : <RegisterForm onGoToLogin={() => goToMode('entrar')} />}

        <p className="auth-switch texto-mudo">
          {mode === 'entrar' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
          <button type="button" className="auth-switch-link" onClick={() => goToMode(mode === 'entrar' ? 'cadastro' : 'entrar')}>
            {mode === 'entrar' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  );
}
