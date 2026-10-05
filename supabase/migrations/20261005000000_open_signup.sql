-- ============================================================================
-- Cadastro aberto (auto-registro de novas parties)
-- ============================================================================
-- Pedido do usuário em 2026-10-05: faltava um jeito de se registrar. Cada cadastro cria
-- 1 usuário no Supabase Auth + 1 linha em accounts (a party daquele usuário), isolada das
-- demais pelas policies "own_account_*" (ver 20260814000000_enable_rls_with_auth.sql).
--
-- Antes de abrir o cadastro, 3 coisas precisavam ser fechadas — todas achadas ao auditar
-- o banco real (pg_policies / column_privileges) em 2026-10-05:
--
-- 1) Policies "authenticated_full_access" (using true / with check true) existiam em
--    accounts, drops, drop_services e serviceiros — NÃO vieram de nenhuma migration do
--    repo (criadas à mão no dashboard, provavelmente na época do login único). Policies
--    permissivas são somadas com OR: na prática anulavam o isolamento por conta, então
--    qualquer usuário logado leria/alteraria os drops e serviceiros de TODAS as parties.
--    Com 1 usuário só era inofensivo; com cadastro aberto seria vazamento total.
--
-- 2) O role authenticated tinha INSERT/UPDATE em TODAS as colunas de accounts, incluindo
--    is_admin e user_id. Combinado com a policy own_account (for all), qualquer usuário
--    poderia se marcar admin com um UPDATE. Passa a poder atualizar só party_name e world
--    (as 2 colunas que as Configurações realmente editam); INSERT fica só pro trigger.
--
-- 3) A linha de accounts passa a ser criada por trigger no signup (security definer),
--    não pelo browser — funciona igual com ou sem confirmação de e-mail ligada (sem
--    confirmação não há sessão logo após o signUp, então o front não conseguiria inserir).
-- ============================================================================

drop policy if exists "authenticated_full_access" on accounts;
drop policy if exists "authenticated_full_access" on drops;
drop policy if exists "authenticated_full_access" on drop_services;
drop policy if exists "authenticated_full_access" on serviceiros;

revoke insert, update on public.accounts from anon, authenticated;
grant update (party_name, world) on public.accounts to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party_name text;
begin
  v_party_name := left(trim(coalesce(new.raw_user_meta_data ->> 'party_name', '')), 40);
  if v_party_name = '' then
    v_party_name := 'Minha Party';
  end if;

  insert into public.accounts (party_name, user_id)
  values (v_party_name, new.id);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user() is 'Cria a conta (party) do usuário recém-cadastrado, com party_name vindo do user_metadata do signUp. type/is_admin ficam nos defaults (party/false) — nunca vêm do cliente.';
