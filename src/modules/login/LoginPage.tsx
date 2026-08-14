import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/** Login compartilhado da PT — 1 única credencial pra todo mundo (ver memória de projeto
 * "regras-gestao-pts"), não é cadastro por pessoa. Só protege os 5 módulos exclusivos de
 * conta (Dashboard, Log de Drops, Histórico, Histórico de XP, Serviceiros) — o resto do
 * app (Split Loot, Timers, Calculadora Tier, Charm Planner) continua aberto sem login. */
export function LoginPage() {
  const { isAuthenticated, login, error } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/';

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setLocalError('E-mail ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '20px' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '32px',
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#10b981' }}>Tibia PT Manager</h1>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            Entre com a credencial da party pra acessar Dashboard, Drops, Histórico e Serviceiros.
          </p>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
          E-mail
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', fontSize: '14px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
          Senha
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', fontSize: '14px' }}
          />
        </label>

        {(localError || error) && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '6px', padding: '8px 10px', color: '#f87171', fontSize: '13px' }}>
            {localError ?? error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: submitting ? '#334155' : '#10b981',
            color: '#0f172a',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '14px',
            cursor: submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
