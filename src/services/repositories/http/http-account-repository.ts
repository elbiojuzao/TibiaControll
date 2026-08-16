import { getSupabaseClient } from '@/services/supabase/supabase-client';
import type { Account } from '@/types';
import type { IAccountRepository } from '../interfaces';

interface AccountRow {
  id: string;
  party_name: string;
  type: 'party' | 'solo';
  created_at: string;
}

function toDomain(row: AccountRow): Account {
  return { id: row.id, partyName: row.party_name, type: row.type, createdAt: row.created_at };
}

/**
 * Resolve a conta (party) do usuário logado. Não precisa (e não dá, com RLS) filtrar por
 * user_id manualmente aqui — a policy "own_account" já restringe a query à(s) linha(s)
 * cujo user_id bate com o usuário autenticado da sessão atual (ver migration
 * 20260814000000_enable_rls_with_auth.sql). Sem sessão válida, RLS bloqueia tudo e a
 * query retorna vazio (não erro) — maybeSingle() vira null nesse caso, igual a "nenhuma
 * conta logada", sem precisar checar auth aqui em cima.
 */
export class HttpAccountRepository implements IAccountRepository {
  async getCurrentAccount(): Promise<Account | null> {
    const { data, error } = await getSupabaseClient().from('accounts').select('*').maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDomain(data as AccountRow) : null;
  }

  /** RLS ("own_account", ver migration 20260814000000) já cobre UPDATE, não só SELECT —
   * qualquer membro logado com a credencial compartilhada da party pode renomeá-la. */
  async updatePartyName(accountId: string, partyName: string): Promise<Account> {
    const { data, error } = await getSupabaseClient()
      .from('accounts')
      .update({ party_name: partyName })
      .eq('id', accountId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as AccountRow);
  }
}
