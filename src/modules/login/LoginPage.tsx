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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '20px' }}>
      <form
        onSubmit={handleSubmit}
        autoComplete="on"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '32px',
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', color: 'var(--color-success)' }}>Tibia PT Manager</h1>
          <p className="texto-mudo" style={{ margin: '6px 0 0 0', fontSize: '13px' }}>
            Entre com a credencial da party pra acessar Dashboard, Drops, Histórico e Serviceiros.
          </p>
        </div>

        <label className="texto-mudo" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="campo-input"
            style={{ marginTop: 0, padding: '8px 10px', fontSize: '14px' }}
          />
        </label>

        <label className="texto-mudo" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
          Senha
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="campo-input"
            style={{ marginTop: 0, padding: '8px 10px', fontSize: '14px' }}
          />
        </label>

        {(localError || error) && <div className="banner-erro">{localError ?? error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="botao-primario"
          style={{ background: submitting ? 'var(--color-border)' : 'var(--color-accent)', padding: '10px', fontSize: '14px' }}
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
