import { describe, it, expect } from 'vitest';
import { friendlyErrorMessage } from './friendly-supabase-error';

describe('friendlyErrorMessage', () => {
  it('traduz unique_violation genérico', () => {
    expect(friendlyErrorMessage({ code: '23505', message: 'duplicate key value violates unique constraint "foo"' }))
      .toBe('Já existe um registro com esse valor.');
  });

  it('traduz unique_violation do vendedor padrão com mensagem específica', () => {
    expect(friendlyErrorMessage({
      code: '23505',
      message: 'duplicate key value violates unique constraint "members_one_default_seller_per_account"',
    })).toBe('Já existe um vendedor padrão configurado pra essa conta.');
  });

  it('traduz not_null_violation', () => {
    expect(friendlyErrorMessage({ code: '23502', message: 'null value in column "x"' }))
      .toBe('Faltou preencher um campo obrigatório.');
  });

  it('traduz foreign_key_violation', () => {
    expect(friendlyErrorMessage({ code: '23503', message: 'violates foreign key constraint' }))
      .toBe('Esse registro está vinculado a outro que não existe mais.');
  });

  it('traduz permissão negada (RLS), tanto código Postgres quanto PostgREST', () => {
    expect(friendlyErrorMessage({ code: '42501', message: 'permission denied' }))
      .toBe('Você não tem permissão para essa ação. Se a sessão expirou, faça login de novo.');
    expect(friendlyErrorMessage({ code: 'PGRST301', message: 'JWT expired' }))
      .toBe('Você não tem permissão para essa ação. Se a sessão expirou, faça login de novo.');
  });

  it('traduz PGRST116 (.single() sem exatamente 1 linha)', () => {
    expect(friendlyErrorMessage({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }))
      .toBe('Não foi possível encontrar esse registro.');
  });

  it('cai no fallback (message original) pra código desconhecido ou ausente', () => {
    expect(friendlyErrorMessage({ code: '99999', message: 'erro estranho' })).toBe('erro estranho');
    expect(friendlyErrorMessage({ message: 'sem código nenhum' })).toBe('sem código nenhum');
  });
});
