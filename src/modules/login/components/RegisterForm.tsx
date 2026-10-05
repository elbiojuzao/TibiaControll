import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PasswordField } from './PasswordField';

const PASSWORD_MIN_LENGTH = 8;
const PARTY_NAME_MAX_LENGTH = 40;

interface RegisterFormProps {
  onGoToLogin: () => void;
}

/** Cadastro de uma nova party. Se o projeto Supabase exigir confirmação de e-mail, mostra o
 * aviso de "confirme seu e-mail" no lugar do formulário; senão o usuário já cai logado
 * (useAuth/onAuthStateChange cuidam do redirect em LoginPage). */
export function RegisterForm({ onGoToLogin }: RegisterFormProps) {
  const { register, error } = useAuth();
  const [partyName, setPartyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (password !== confirmPassword) {
      setLocalError('As senhas não conferem.');
      return;
    }
    setSubmitting(true);
    try {
      const outcome = await register(email, password, partyName);
      if (outcome.needsEmailConfirmation) setConfirmationSentTo(email);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSentTo) {
    return (
      <div className="auth-form" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px' }}>📬</div>
        <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--color-success)' }}>Confirme seu e-mail</h2>
        <p className="texto-mudo" style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
          Enviamos um link de confirmação para <strong style={{ color: 'var(--color-text)' }}>{confirmationSentTo}</strong>.
          Clique nele pra ativar a conta e depois entre aqui.
        </p>
        <button type="button" className="botao-primario auth-submit" onClick={onGoToLogin}>
          Ir para o login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="auth-form">
      <label className="auth-field">
        Nome da party
        <input
          type="text"
          name="party"
          required
          autoFocus
          minLength={2}
          maxLength={PARTY_NAME_MAX_LENGTH}
          placeholder="Ex: Thanatos PT"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
          className="campo-input auth-input"
        />
      </label>

      <label className="auth-field">
        E-mail
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="campo-input auth-input"
        />
      </label>

      <PasswordField
        label={`Senha (mín. ${PASSWORD_MIN_LENGTH} caracteres)`}
        name="new-password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        value={password}
        onChange={setPassword}
      />
      <PasswordField
        label="Confirmar senha"
        name="confirm-password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        value={confirmPassword}
        onChange={setConfirmPassword}
      />

      <p className="texto-fraco" style={{ margin: 0, fontSize: '11px', lineHeight: 1.5 }}>
        A conta é da party inteira: quem entrar com esse e-mail e senha enxerga os mesmos drops, membros e histórico.
      </p>

      {(localError || error) && <div className="banner-erro">{localError ?? error}</div>}

      <button type="submit" disabled={submitting} className="botao-primario auth-submit">
        {submitting ? 'Criando conta...' : 'Criar conta'}
      </button>
    </form>
  );
}
