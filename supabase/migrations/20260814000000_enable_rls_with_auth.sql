-- ============================================================================
-- Liga o Supabase Auth (login real) e religa o RLS que tinha sido desligado em
-- 20260806020000_disable_rls_until_auth.sql por não existir usuário
-- autenticado ainda pra escrever policy nenhuma.
--
-- Desenhado desde já pra suportar MÚLTIPLAS contas/parties no futuro (pedido
-- explícito do usuário) — cada conta fica ligada a exatamente 1 usuário do
-- Supabase Auth (login de PARTY compartilhado, não por pessoa, ver memória
-- "regras-gestao-pts": ainda é 1 login pra todo mundo da mesma party, só que
-- agora N parties diferentes podem existir no mesmo banco, cada uma com seu
-- próprio login e sem enxergar o dado da outra).
-- ============================================================================

alter table accounts add column if not exists user_id uuid unique references auth.users(id);

comment on column accounts.user_id is 'Usuário do Supabase Auth dono dessa conta/party. 1 conta = 1 login (compartilhado por todos os membros da party via a mesma credencial) — não é 1 linha por pessoa.';

alter table accounts enable row level security;
alter table serviceiros enable row level security;
alter table drops enable row level security;
alter table drop_services enable row level security;

-- accounts: cada usuário só vê a própria linha (a conta ligada ao seu user_id)
create policy "own_account" on accounts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- drops/serviceiros: só a linha cujo account_id pertence a uma conta do usuário logado
create policy "own_account_drops" on drops
  for all to authenticated
  using (account_id in (select id from accounts where user_id = auth.uid()))
  with check (account_id in (select id from accounts where user_id = auth.uid()));

create policy "own_account_serviceiros" on serviceiros
  for all to authenticated
  using (account_id in (select id from accounts where user_id = auth.uid()))
  with check (account_id in (select id from accounts where user_id = auth.uid()));

-- drop_services não tem account_id direto (é filha de drops) — sobe 1 nível pra checar
create policy "own_account_drop_services" on drop_services
  for all to authenticated
  using (exists (
    select 1 from drops d
    join accounts a on a.id = d.account_id
    where d.id = drop_services.drop_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from drops d
    join accounts a on a.id = d.account_id
    where d.id = drop_services.drop_id and a.user_id = auth.uid()
  ));

-- ============================================================================
-- PASSO MANUAL depois de rodar essa migration:
-- 1. Criar o usuário de login em Authentication -> Users -> Add user (marcar
--    "Auto Confirm User").
-- 2. Ligar esse usuário à conta "Thanatos PT" que já existe, trocando o
--    e-mail abaixo pelo que você cadastrou:
--
-- update accounts set user_id = (select id from auth.users where email = 'SEU_EMAIL_AQUI')
--   where id = '7206010b-977b-4a8b-a48a-f3a073b9c917';
--
-- Sem esse UPDATE, o login funciona mas a conta fica "órfã" (user_id null) e
-- as policies acima não deixam essa conta/os drops dela aparecerem pra
-- ninguém, mesmo autenticado.
-- ============================================================================
