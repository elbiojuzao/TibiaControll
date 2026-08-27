import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const SAVED_EMAIL_KEY = 'tibia-pts:saved-login-email-v1';

/** Login é compartilhado da PT (1 única credencial pra todo mundo), então lembrar o
 * e-mail aqui é conveniente — evita todo mundo ter que digitar o mesmo e-mail toda hora
 * (2026-08-26, pedido do usuário). A SENHA não entra mais aqui (2026-08-27, revisão de
 * segurança do próprio usuário: "vamos tirar do localstorage a senha... procurar uma
 * maneira de salvar mais eficiente") — localStorage é texto puro, legível por qualquer
 * script que rode na página (ex: uma dependência comprometida), e não tem como ser
 * revogado como uma sessão pode. A senha fica pro que já existe de mais seguro pra isso:
 * 1) o gerenciador de senha do NAVEGADOR (autoComplete="current-password" abaixo já deixa
 *    o Chrome/Firefox/Edge oferecerem salvar/preencher — fica fora do alcance do JS da
 *    página, diferente de localStorage); 2) a sessão do Supabase Auth já fica persistida
 *    sozinha (createClient() usa persistSession:true por padrão, ver supabase-client.ts) —
 *    então na prática quem já logou uma vez nem volta a ver esta tela até fazer logout ou
 *    o token expirar, sem precisar lembrar senha nenhuma. */
function readSavedEmail(): string | null {
  try {
    return localStorage.getItem(SAVED_EMAIL_KEY);
  } catch {
    return null;
  }
}

function writeSavedEmail(email: string | null): void {
  try {
    if (email) localStorage.setItem(SAVED_EMAIL_KEY, email);
    else localStorage.removeItem(SAVED_EMAIL_KEY);
  } catch {
    // localStorage indisponível — segue sem persistir.
  }
}

const OLD_SAVED_LOGIN_KEY = 'tibia-pts:saved-login-v1';

/** Migração 1x (2026-08-27) — a versão anterior deste componente salvava e-mail+senha em
 * texto puro sob essa chave. Remove qualquer vestígio dela do localStorage de quem já
 * tinha usado o "Salvar login" antes desse fix de segurança, migrando só o e-mail (que não
 * é sensível) pra chave nova. Roda 1x no carregamento do módulo, não a cada render. */
(function migrateOldSavedLogin() {
  try {
    const raw = localStorage.getItem(OLD_SAVED_LOGIN_KEY);
    if (!raw) return;
    localStorage.removeItem(OLD_SAVED_LOGIN_KEY);
    const parsed = JSON.parse(raw) as { email?: string };
    if (parsed.email && !localStorage.getItem(SAVED_EMAIL_KEY)) {
      localStorage.setItem(SAVED_EMAIL_KEY, parsed.email);
    }
  } catch {
    // localStorage indisponível ou dado corrompido — nada a fazer.
  }
})();

/** Login compartilhado da PT — 1 única credencial pra todo mundo (ver memória de projeto
 * "regras-gestao-pts"), não é cadastro por pessoa. Só protege os 5 módulos exclusivos de
 * conta (Dashboard, Log de Drops, Histórico, Histórico de XP, Serviceiros) — o resto do
 * app (Split Loot, Timers, Calculadora Tier, Charm Planner) continua aberto sem login. */
export function LoginPage() {
  const { isAuthenticated, login, error } = useAuth();
  const location = useLocation();
  const savedEmail = useState(readSavedEmail)[0];
  const [email, setEmail] = useState(savedEmail ?? '');
  const [password, setPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(!!savedEmail);
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
      writeSavedEmail(rememberLogin ? email : null);
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

        <label className="label-checkbox texto-mudo" style={{ fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={rememberLogin}
            onChange={(e) => setRememberLogin(e.target.checked)}
          />
          Lembrar meu e-mail neste dispositivo
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
