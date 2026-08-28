/**
 * Tabela de drops por boss/quest, extraída da planilha "Itens.xlsx" fornecida pelo usuário
 * em 2026-08-05. Migrada pro banco em 2026-08-14 (tabela real `boss_items`, ver migration
 * 20260814050000_create_boss_items_table.sql, com a correção de que "Grand Sanguine *" só
 * cai do Bakra, não de qualquer boss de Rotten Blood) — o dropdown de Item no
 * DropFormModal.tsx usa useBossItems()/a tabela real agora, NÃO mais este arquivo.
 * Mantido só como fonte de nomes de item pro script scripts/fetch-item-icons.mjs (lê o
 * texto deste arquivo via regex, não importa o módulo) — se editar itens aqui, só afeta
 * quais ícones são baixados, não o que aparece no formulário de drop.
 */
export const BOSS_ITEMS: Record<string, string[]> = {
  'Rotten Blood': [
    'Abridged Promotion Scroll', 'Advanced Promotion Scroll', 'Basic Promotion Scroll',
    'Spiritual Horseshoes', 'Cursed Wood', 'Darklight Geode', 'darklight heart', 'Tainted Heart',
    'Grand Sanguine Battleaxe', 'Grand Sanguine Blade', 'Grand Sanguine Bludgeon', 'Grand Sanguine Bow',
    'Grand Sanguine Coil', 'Grand Sanguine Crossbow', 'Grand Sanguine Cudgel', 'Grand Sanguine Hatchet',
    'Grand Sanguine Razor', 'Grand Sanguine Rod', 'Grand Sanguine Claws',
    'Sanguine Battleaxe', 'Sanguine Blade', 'Sanguine Bludgeon', 'Sanguine Boots', 'Sanguine Bow',
    'Sanguine Coil', 'Sanguine Crossbow', 'Sanguine Cudgel', 'Sanguine Galoshes', 'Sanguine Greaves',
    'Sanguine Hatchet', 'Sanguine Legs', 'Sanguine Razor', 'Sanguine Rod', 'Sanguine Trousers', 'Sanguine Claws',
  ],
  'Soul War': [
    'Spectral Horseshoes', 'Spectral Horse Tack', 'Spectral Saddle', 'The Skull of a Beast',
    'Bracelet of Strengthening', 'Pair of Soulstalkers', 'Pair of Soulwalkers', 'Soulbastion',
    'Soulbiter', 'Soulbleeder', 'Soulcrusher', 'Soulcutter', 'Souleater (Axe)', 'Soulhexer',
    'Soulmaimer', 'Soulmantle', 'Soulpiercer', 'Soulshanks', 'Soulshell', 'Soulshredder',
    'Soulshroud', 'Soulstrider', 'Soultainter', 'Soulgarb', 'Soulsoles', 'Soulkamas',
  ],
  GnomProna: [
    'Alicorn Headguard', 'Alicorn Quiver', 'Alicorn Ring', 'Arboreal Crown', 'Arboreal Ring',
    'Arboreal Tome', 'Arcanomancer Folio', 'Arcanomancer Regalia', 'Arcanomancer Sigil',
    'Spiritthorn Armor', 'Spiritthorn Helmet', 'Spiritthorn Ring', 'Ethereal Coned Hat', 'Ethereal Ring',
  ],
  SoulCore: [
    'SoulCore Sulphur Spouter', 'SoulCore Sulphider', 'SoulCore Undertaker', 'SoulCore Nighthunter',
    'SoulCore Stalking Stalk', 'SoulCore Darklight Constructor', 'SoulCore Darklight Emitter',
    'SoulCore Wandering Pillar', 'SoulCore Darklight Source', 'SoulCore Darklight Striker',
    'SoulCore Darklight Matter', 'SoulCore Walking Pillar', 'SoulCore Mycobiontic Beetle',
    'SoulCore Bloated Man-maggot', 'SoulCore Oozing Corpus', 'SoulCore Sopping Corpus',
    'SoulCore Meandering Mushroom', 'SoulCore Rotten Man-maggot', 'SoulCore Oozing Carcass', 'SoulCore Sopping Carcass',
  ],
  Warzone: ['Gnome Legs', 'Gnome Armor', 'Gnome Helmet'],
  Vladrukh: [
    'Norcferatu Bloodhide', 'Norcferatu Bonecloak', 'Norcferatu Tuskplate', 'Norcferatu Fangstompers',
    'Norcferatu Goretrampers', 'Norcferatu Bloodstrider', 'Norcferatu Fleshguards', 'Norcferatu Thornwraps',
    'Norcferatu Bonehood', 'Norcferatu Skullguard',
  ],
  'Eldritch Dragon Lord': ['Fiery Crypt Rune'],
  'Ice Horror': ['Icy Crypt Rune'],
  'The Gravedigger': ['Deathly Crypt Rune'],
  'Adventurer Group': ['Ancient Crypt Rune'],
  'Bone Overlord': ['Necromantic Crypt Rune'],
  Crypt: ['Crypt Spine', 'Crypt Slicer', 'Crypt Bile', 'Crypt Strike', 'Crypt Splitter', 'Crypt Breaker', 'Crypt Jaw'],
  Arbaziloth: [
    'Demon Claws', 'Demon Skull', 'Demon In A Green Box', 'Inferniarch Arbalest', 'Inferniarch Battleaxe',
    'Inferniarch Blade', 'Inferniarch Bow', 'Inferniarch Claws', 'Inferniarch Flail', 'Inferniarch Greataxe',
    'Inferniarch Rod', 'Inferniarch Slayer', 'Inferniarch Wand', 'Inferniarch Warhammer',
    'Maliceforged Helmet', 'Hellstalker Visor', 'Dreadfire Headpiece', 'Demonfang Mask', 'Demon Mengu',
  ],
  'The Rootkraken': [
    'Amber Bow', 'Amber Crossbow', 'Amber Cudgel', 'Amber Bludgeon', 'Amber Axe', 'Amber Greataxe',
    'Amber Slayer', 'Amber Sabre', 'Amber Rod', 'Amber Wand', 'Amber Kusarigama', 'Strange Inedible Fruit',
  ],
  'Make Belive': [
    'Cloud in a Bottle', 'Auric Moon Sigil', 'Moonsilver Battle Visor', 'Moonsilver Nimbus Hat',
    'Moonsilver Spirit Mask', 'Moonsilver Strike Helm', 'Moonsilver Trail Hood',
  ],
  Phosphorus: [
    'Auric Moon Sigil', 'Cloud in a Bottle', 'Moonsilver Axe', 'Moonsilver Bow', 'Moonsilver Channeler',
    'Moonsilver Chopper', 'Moonsilver Claymore', 'Moonsilver Crusher', 'Moonsilver Crossbow',
    'Moonsilver Epee', 'Moonsilver Katar', 'Moonsilver Mace', 'Moonsilver Sceptre',
  ],
  'Court Warlock': [
    'Stag Boots', 'Stag Footwraps', 'Stag Helmet', 'Stag Legs', 'Stag Plate',
    'Stag Robe', 'Stag Scrolls', 'Stag Shield', 'Stag Shinguards', 'Stag Spellbook',
  ],
};
