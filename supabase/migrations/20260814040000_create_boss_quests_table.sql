-- ============================================================================
-- Tibia Party Manager — tabela de referência boss -> quest
-- ============================================================================
-- Pedido do usuário em 2026-08-14: no formulário de registro de drop, filtrar
-- o dropdown de "Boss" por quest via checkboxes (persistidos em localStorage)
-- — "não aparece todos os boss a não ser que esteja com todas as box
-- selecionadas". Precisa de uma lista de bosses individuais (Chagorz, Vemiath,
-- Plunder, Malice...) agrupados por quest (Rotten Blood, Soul War...), que não
-- existia — só existia BOSS_ITEMS (services/lootdrop/boss-items-data.ts),
-- que já mistura granularidades (algumas chaves são quest de verdade com
-- vários bosses — 'Rotten Blood', 'Soul War' — outras já são boss individual
-- usado direto — 'Arbaziloth', 'SoulCore', 'Phosphorus').
--
-- Dado universal do jogo (não é por conta/party) — sem account_id, mesmo
-- padrão de xp_levels (migration 20260814020000): RLS ligada só pra bloquear
-- escrita via client, leitura pública.
--
-- 'Crypt' foi adicionado ao seed mesmo não aparecendo na lista original que o
-- usuário mandou (print de planilha) — representa o baú compartilhado da
-- dungeon Grave Borne (mesmo conceito de 'Plunder'/'SoulCore' noutras quests)
-- e já tinha entrada própria em BOSS_ITEMS com 7 itens de arma; sem incluir
-- aqui, esses itens ficariam inacessíveis no formulário depois dessa mudança.
-- Se estiver errado, é só remover a linha.
-- ============================================================================

create table if not exists boss_quests (
  boss text primary key,
  quest text not null
);

comment on table boss_quests is 'Referência boss individual -> quest (fórmula de agrupamento do jogo), usada pra filtrar o dropdown de Boss no formulário de drop por quest (checkboxes em localStorage). Item cascade (services/lootdrop/boss-items-data.ts) continua igual: tenta BOSS_ITEMS[boss] primeiro (bosses que já são chave direta), senão cai pra BOSS_ITEMS[quest].';

create index if not exists idx_boss_quests_quest on boss_quests(quest);

alter table boss_quests enable row level security;

create policy "public_read_boss_quests" on boss_quests
  for select
  to anon, authenticated
  using (true);

insert into boss_quests (boss, quest) values
  ('Chagorz', 'Rotten Blood'),
  ('Vemiath', 'Rotten Blood'),
  ('Ichgahal', 'Rotten Blood'),
  ('Murcion', 'Rotten Blood'),
  ('Bakra', 'Rotten Blood'),
  ('Plunder', 'GnomProna'),
  ('SoulCore', 'SoulCore'),
  ('Malice', 'Soul War'),
  ('Greed', 'Soul War'),
  ('Spite', 'Soul War'),
  ('Cruelty', 'Soul War'),
  ('Hatred', 'Soul War'),
  ('Megalomania', 'Soul War'),
  ('Warzone', 'Warzone'),
  ('Vladrukh', 'Vladrukh'),
  ('Ice Horror', 'Grave Borne'),
  ('The Gravedigger', 'Grave Borne'),
  ('Bone Overlord', 'Grave Borne'),
  ('Eldritch Dragon Lord', 'Grave Borne'),
  ('Adventurer Group', 'Grave Borne'),
  ('Crypt', 'Grave Borne'),
  ('Arbaziloth', 'Arbaziloth'),
  ('The Rootkraken', 'The Rootkraken'),
  ('Maior Domus', 'Make Belive'),
  ('Mima Haffar', 'Make Belive'),
  ('Phosphorus', 'Make Belive');
