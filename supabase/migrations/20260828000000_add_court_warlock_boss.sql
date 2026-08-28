-- ============================================================================
-- Tibia Party Manager — cadastra o boss Court Warlock
-- ============================================================================
-- Pedido do usuário em 2026-08-28: novo boss (dropado individual ou em party)
-- cuja quest tem o mesmo nome do boss (mesmo padrão de 'The Rootkraken' em
-- boss_quests, migration 20260814040000) — não faz parte de nenhuma quest
-- maior com outros bosses.
-- ============================================================================

insert into boss_quests (boss, quest) values
  ('Court Warlock', 'Court Warlock');

insert into boss_items (boss, item) values
  ('Court Warlock', 'Stag Boots'),
  ('Court Warlock', 'Stag Footwraps'),
  ('Court Warlock', 'Stag Helmet'),
  ('Court Warlock', 'Stag Legs'),
  ('Court Warlock', 'Stag Plate'),
  ('Court Warlock', 'Stag Robe'),
  ('Court Warlock', 'Stag Scrolls'),
  ('Court Warlock', 'Stag Shield'),
  ('Court Warlock', 'Stag Shinguards'),
  ('Court Warlock', 'Stag Spellbook');
