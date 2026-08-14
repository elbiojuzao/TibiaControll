-- ============================================================================
-- Tibia Party Manager — tabela de referência de XP por nível
-- ============================================================================
-- Pedido do usuário em 2026-08-14: base de dados real com o total de XP
-- necessário por nível (de 50 em 50, até o nível 4000), pra alimentar a "Meta
-- XP Diária" do Dashboard (hoje é mock/vazio pra conta real — ver
-- mockMemberXpStats/MemberXpStats.metas). Fórmula oficial do Tibia, conferida
-- contra https://www.tibiawiki.com.br/wiki/F%C3%B3rmula_de_Experi%C3%AAncia:
--   xp(L) = floor((50/3) * (L^3 - 6*L^2 + 17*L - 12))
-- (equivalente à forma da wiki, (50*(L-1)^3 - 150*(L-1)^2 + 400*(L-1))/3 —
-- validado batendo o exemplo da própria página: nível 15 = 37.800 XP).
-- Mesma fórmula já usada em src/services/xp-sheet/level-prediction.ts
-- (xpParaNivel) pra "Previsão fim de ano" — não duplicar/discordar dela.
--
-- Dado universal do jogo (não é por conta/party) — sem account_id, sem
-- vínculo com `accounts`. RLS ligada só pra fechar escrita (nada além do SQL
-- Editor deveria alterar essa tabela); leitura é pública mesmo sem sessão.
-- ============================================================================

create table if not exists xp_levels (
  level integer primary key,
  xp_total bigint not null check (xp_total >= 0)
);

comment on table xp_levels is 'Referência de XP total acumulado necessário por nível (fórmula oficial do Tibia), de 50 em 50 níveis até o 4000. Usado pra calcular a Meta XP Diária no Dashboard.';
comment on column xp_levels.xp_total is 'XP total acumulada (desde o nível 1) necessária pra alcançar esse nível — não é XP incremental entre marcos.';

alter table xp_levels enable row level security;

create policy "public_read_xp_levels" on xp_levels
  for select
  to anon, authenticated
  using (true);

insert into xp_levels (level, xp_total) values
  (50, 1847300),
  (100, 15694800),
  (150, 54042300),
  (200, 129389800),
  (250, 254237300),
  (300, 441084800),
  (350, 702432300),
  (400, 1050779800),
  (450, 1498627300),
  (500, 2058474800),
  (550, 2742822300),
  (600, 3564169800),
  (650, 4535017300),
  (700, 5667864800),
  (750, 6975212300),
  (800, 8469559800),
  (850, 10163407300),
  (900, 12069254800),
  (950, 14199602300),
  (1000, 16566949800),
  (1050, 19183797300),
  (1100, 22062644800),
  (1150, 25215992300),
  (1200, 28656339800),
  (1250, 32396187300),
  (1300, 36448034800),
  (1350, 40824382300),
  (1400, 45537729800),
  (1450, 50600577300),
  (1500, 56025424800),
  (1550, 61824772300),
  (1600, 68011119800),
  (1650, 74596967300),
  (1700, 81594814800),
  (1750, 89017162300),
  (1800, 96876509800),
  (1850, 105185357300),
  (1900, 113956204800),
  (1950, 123201552300),
  (2000, 132933899800),
  (2050, 143165747300),
  (2100, 153909594800),
  (2150, 165177942300),
  (2200, 176983289800),
  (2250, 189338137300),
  (2300, 202254984800),
  (2350, 215746332300),
  (2400, 229824679800),
  (2450, 244502527300),
  (2500, 259792374800),
  (2550, 275706722300),
  (2600, 292258069800),
  (2650, 309458917300),
  (2700, 327321764800),
  (2750, 345859112300),
  (2800, 365083459800),
  (2850, 385007307300),
  (2900, 405643154800),
  (2950, 427003502300),
  (3000, 449100849800),
  (3050, 471947697300),
  (3100, 495556544800),
  (3150, 519939892300),
  (3200, 545110239800),
  (3250, 571080087300),
  (3300, 597861934800),
  (3350, 625468282300),
  (3400, 653911629800),
  (3450, 683204477300),
  (3500, 713359324800),
  (3550, 744388672300),
  (3600, 776305019800),
  (3650, 809120867300),
  (3700, 842848714800),
  (3750, 877501062300),
  (3800, 913090409800),
  (3850, 949629257300),
  (3900, 987130104800),
  (3950, 1025605452300),
  (4000, 1065067799800);
