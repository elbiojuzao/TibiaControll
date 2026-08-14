-- ============================================================================
-- Tibia Party Manager — tabela de members (cadastro dos jogadores da party)
-- ============================================================================
-- Antes disso os "membros" eram um array fixo em src/mocks/data/members.ts —
-- Dashboard, Log de Drops, Histórico e Histórico de XP já leem via
-- useMembers()/IMemberRepository (repository pattern já existia), só faltava
-- a tabela real + UI de cadastro (módulo Configurações). Pedido do usuário em
-- 2026-08-14: deixar o usuário cadastrar os 4-5 jogadores base da party (os
-- que sempre aparecem nesses módulos), em vez de mock fixo.
--
-- account_id/RLS seguem o mesmo padrão de drops/serviceiros (ver migration
-- 20260814000000_enable_rls_with_auth.sql).
-- ============================================================================

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  character_name text not null,
  vocation text not null check (vocation in ('EK', 'ED', 'MS', 'RP', 'EM', 'OTHER')),
  is_serviceiro boolean not null default false,
  serviceiro_share_percent numeric,
  owner_character_name text,
  skill_category text check (skill_category in ('magiclevel', 'axefighting', 'swordfighting', 'clubfighting', 'distancefighting')),
  created_at timestamptz not null default now()
);

create index if not exists idx_members_account on members(account_id);

comment on column members.skill_category is 'Só relevante pra EK (pode treinar Axe/Sword/Club) — outras vocações inferem a categoria certa sozinhas, ver resolveSkillCategory().';
comment on column members.character_name is 'Precisa bater exatamente com (a) o nome real do personagem no Tibia (usado nas consultas TibiaData) e (b) o cabeçalho da coluna correspondente na planilha de XP do usuário — ver api/_lib/xp-sheet.ts.';

alter table members enable row level security;

create policy "own_account_members" on members
  for all to authenticated
  using (account_id in (select id from accounts where user_id = auth.uid()))
  with check (account_id in (select id from accounts where user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- Seed: os 4 membros da PT que já existe (Thanatos PT), migrados do mock
-- (src/mocks/data/members.ts) — editáveis depois pela UI de Configurações.
-- ----------------------------------------------------------------------------
insert into members (account_id, character_name, vocation, is_serviceiro, skill_category)
values
  ('7206010b-977b-4a8b-a48a-f3a073b9c917', 'Koe Psciko', 'EK', false, 'axefighting'),
  ('7206010b-977b-4a8b-a48a-f3a073b9c917', 'Thanatos Celestial', 'ED', false, 'magiclevel'),
  ('7206010b-977b-4a8b-a48a-f3a073b9c917', 'Marugo', 'MS', false, 'magiclevel'),
  ('7206010b-977b-4a8b-a48a-f3a073b9c917', 'Thor Zynz', 'RP', false, 'distancefighting');
