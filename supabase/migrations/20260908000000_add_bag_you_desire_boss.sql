-- ============================================================================
-- Tibia Party Manager — cadastra "Bag You Desire" (bag da quest Soul War)
-- ============================================================================
-- Pedido do usuário em 2026-09-08: "o usuario pode selecionar no lugar do
-- boss 'Bag You Desire' que é a bag da soul war pode vim todos os itens da
-- soulwar". Mesmo padrão de boss "não-criatura" já usado por SoulCore/
-- Plunder/Warzone/Crypt (baú/loot compartilhado tratado como boss normal em
-- boss_quests/boss_items, ver migration 20260814040000).
--
-- Quest reaproveitada: 'Soul War' já existe em boss_quests (Malice, Greed,
-- Spite, Cruelty, Hatred, Megalomania) — Bag You Desire entra no mesmo grupo
-- pro filtro de quest do formulário de drop.
--
-- Itens: a Bag You Desire (TibiaWiki) se transforma em 1 das 21 peças do
-- Soul Set ao ser aberta — mesmas 21 peças já cadastradas em boss_items pros
-- 6 bosses de Soul War acima, SEM os 5 itens extras que só esses bosses
-- dropam (Spectral Horseshoes/Horse Tack/Saddle, The Skull of a Beast,
-- Bracelet of Strengthening — não fazem parte do Soul Set e não saem da bag).
-- ============================================================================

insert into boss_quests (boss, quest) values
  ('Bag You Desire', 'Soul War');

insert into boss_items (boss, item) values
  ('Bag You Desire', 'Pair of Soulstalkers'),
  ('Bag You Desire', 'Pair of Soulwalkers'),
  ('Bag You Desire', 'Soulbastion'),
  ('Bag You Desire', 'Soulbiter'),
  ('Bag You Desire', 'Soulbleeder'),
  ('Bag You Desire', 'Soulcrusher'),
  ('Bag You Desire', 'Soulcutter'),
  ('Bag You Desire', 'Souleater (Axe)'),
  ('Bag You Desire', 'Soulgarb'),
  ('Bag You Desire', 'Soulhexer'),
  ('Bag You Desire', 'Soulkamas'),
  ('Bag You Desire', 'Soulmaimer'),
  ('Bag You Desire', 'Soulmantle'),
  ('Bag You Desire', 'Soulpiercer'),
  ('Bag You Desire', 'Soulshanks'),
  ('Bag You Desire', 'Soulshell'),
  ('Bag You Desire', 'Soulshredder'),
  ('Bag You Desire', 'Soulshroud'),
  ('Bag You Desire', 'Soulsoles'),
  ('Bag You Desire', 'Soulstrider'),
  ('Bag You Desire', 'Soultainter');
