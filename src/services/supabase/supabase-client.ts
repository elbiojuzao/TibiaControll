import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

/**
 * Client do Supabase, criado sob demanda (não no import do módulo). Importante: os
 * repositórios HTTP importam este arquivo mesmo quando não estão ativos (USE_MOCK /
 * *_USE_SUPABASE=false) — se a criação do client rodasse no top-level e lançasse erro
 * por falta de env vars, o import quebraria o bundle inteiro e o app nem chegaria a
 * montar o React (tela preta), mesmo em ambientes onde o Supabase nunca é usado de
 * verdade (ex: deploy sem as env vars configuradas). Lançar o erro só quando alguém
 * de fato chama getSupabaseClient() isola o problema ao recurso que precisa dele.
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY não configuradas. Defina no .env.local (ver .env.example).',
    );
  }

  cachedClient = createClient(url, publishableKey);
  return cachedClient;
}
