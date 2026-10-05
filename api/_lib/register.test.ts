import { describe, expect, it } from 'vitest';
import { validateRegisterInput } from './register';

describe('validateRegisterInput', () => {
  it('aceita dados válidos', () => {
    expect(validateRegisterInput('a@b.com', '12345678', 'Thanatos PT')).toBeNull();
  });

  it('rejeita e-mail inválido', () => {
    expect(validateRegisterInput('sem-arroba', '12345678', 'Thanatos PT')).toMatch(/e-mail/i);
    expect(validateRegisterInput(undefined, '12345678', 'Thanatos PT')).toMatch(/e-mail/i);
  });

  it('rejeita senha curta', () => {
    expect(validateRegisterInput('a@b.com', '1234567', 'Thanatos PT')).toMatch(/senha/i);
  });

  it('rejeita nome de party curto, longo ou só espaços', () => {
    expect(validateRegisterInput('a@b.com', '12345678', ' a ')).toMatch(/party/i);
    expect(validateRegisterInput('a@b.com', '12345678', 'x'.repeat(41))).toMatch(/party/i);
  });
});
