import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginRequestError } from '@/services/supabase/supabase-auth';
import { readSavedEmail, writeSavedEmail } from '../saved-email';
import { PasswordField } from './PasswordField';

export function LoginForm() {
  const { login, error } = useAuth();
  const savedEmail = useState(readSavedEmail)[0];
  const [email, setEmail] = useState(savedEmail ?? '');
  const [password, setPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(!!savedEmail);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      writeSavedEmail(rememberLogin ? email : null);
    } catch (err) {
      // Credencial errada (401) sempre vira a mensagem genérica abaixo — não confirma/nega
      // detalhe nenhum da conta. Qualquer outro caso (429 "muitas tentativas", 400 campo
      // faltando, erro de servidor) mostra a mensagem tal como veio de /api/login
      // (2026-09-30) — sem isso, o aviso de limite de tentativas ficaria escondido atrás
      // desse texto genérico.
      const isBadCredentials = err instanceof LoginRequestError && err.status === 401;
      setLocalError(!isBadCredentials && err instanceof Error ? err.message : 'E-mail ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="auth-form">
      <label className="auth-field">
        E-mail
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="campo-input auth-input"
        />
      </label>

      <PasswordField label="Senha" name="password" autoComplete="current-password" value={password} onChange={setPassword} />

      <label className="label-checkbox texto-mudo" style={{ fontSize: '13px' }}>
        <input type="checkbox" checked={rememberLogin} onChange={(e) => setRememberLogin(e.target.checked)} />
        Lembrar meu e-mail neste dispositivo
      </label>

      {(localError || error) && <div className="banner-erro">{localError ?? error}</div>}

      <button type="submit" disabled={submitting} className="botao-primario auth-submit">
        {submitting ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
