/** Erro genérico que qualquer chamada do Supabase (Postgrest ou Auth) pode lançar —
 * PostgrestError sempre tem `code`/`details`; erros de Auth normalmente não têm `code`
 * nesse formato, então caem direto no fallback. */
interface SupabaseLikeError {
  message: string;
  code?: string;
  details?: string | null;
}

/**
 * Traduz o erro cru do Supabase (Postgrest/Postgres) pra uma frase legível em pt-BR,
 * baseado no `code` (estável — nunca no texto de `message`, que pode mudar entre versões
 * do Postgres). Sem isso, mensagens tipo `duplicate key value violates unique constraint
 * "members_one_default_seller_per_account"` apareciam cruas nos banners de erro do app
 * (auditoria de 2026-08-28). Código sem mapeamento conhecido cai no `message` original —
 * nunca esconde informação nova, só melhora os casos já catalogados.
 */
export function friendlyErrorMessage(error: SupabaseLikeError): string {
  switch (error.code) {
    case '23505': // unique_violation
      if (error.details?.includes('members_one_default_seller_per_account') || error.message.includes('members_one_default_seller_per_account')) {
        return 'Já existe um vendedor padrão configurado pra essa conta.';
      }
      return 'Já existe um registro com esse valor.';
    case '23502': // not_null_violation
      return 'Faltou preencher um campo obrigatório.';
    case '23503': // foreign_key_violation
      return 'Esse registro está vinculado a outro que não existe mais.';
    case '42501': // insufficient_privilege (RLS)
    case 'PGRST301':
      return 'Você não tem permissão para essa ação. Se a sessão expirou, faça login de novo.';
    case 'PGRST116': // .single() não retornou exatamente 1 linha (pode ser RLS filtrando)
      return 'Não foi possível encontrar esse registro.';
    default:
      return error.message;
  }
}
