import { useState } from 'react';

interface PasswordFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
}

/** Campo de senha com botão de mostrar/ocultar — usado no login e no cadastro. */
export function PasswordField({ label, name, value, onChange, autoComplete, minLength }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="auth-field">
      {label}
      <div className="auth-input-wrap">
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="campo-input auth-input"
        />
        <button
          type="button"
          className="auth-input-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          title={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? '🙈' : '👁️'}
        </button>
      </div>
    </label>
  );
}
