-- ============================================================================
-- Tibia Party Manager — tabela de referência de eventos oficiais anuais
-- ============================================================================
-- Pedido do usuário em 2026-08-17: cadastrar os eventos oficiais fixos do
-- Tibia (mesma data todo ano) que dão bônus de jogo de verdade (rapid
-- respawn, boost de poção, XP), pra depois marcar esses dias no calendário
-- (Histórico) com uma flag/faixa identificando "dia de evento".
--
-- Dado universal do jogo (regra fixa, não é por conta/party) — mesmo padrão
-- de xp_levels/boss_quests/boss_items: sem account_id, RLS ligada só pra
-- bloquear escrita via client, leitura pública.
--
-- start_month/start_day/end_month/end_day (SEM ano) — os eventos se repetem
-- todo ano na mesma janela, então a data é armazenada como padrão recorrente
-- (mês/dia), não uma data concreta de um ano específico. O calendário calcula
-- "esse dia do mês em qualquer ano cai dentro do evento?" comparando só
-- mês/dia.
--
-- categories (text[]) — 'rapid_respawn' | 'xp_boost' | 'potion_boost'. Um
-- evento pode ter mais de uma categoria ao mesmo tempo (ex: The Great
-- Expedition pode dar Rapid Respawn E bônus de XP juntos, dependendo da
-- votação daquele ano).
--
-- Levantado manualmente pesquisando tibiawiki.com.br em 2026-08-17 (scraping
-- automático do calendário oficial do tibia.com e do fandom.com estão
-- bloqueados por desafio Cloudflare — ver memória "integracao_eventos_tibia").
-- Eventos como "The Colours of Magic" e "The Great Expedition" têm resultado
-- VARIÁVEL a cada edição (o servidor vota entre opções) — as categorias aqui
-- cobrem TODAS as possibilidades do "pool", não uma garantia fixa do que vai
-- acontecer naquele ano específico.
-- ============================================================================

create table if not exists tibia_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_month int not null check (start_month between 1 and 12),
  start_day int not null check (start_day between 1 and 31),
  end_month int not null check (end_month between 1 and 12),
  end_day int not null check (end_day between 1 and 31),
  categories text[] not null,
  description text not null,
  created_at timestamptz not null default now()
);

comment on table tibia_events is 'Eventos oficiais anuais fixos da CipSoft com os bonus de jogo que concedem (rapid_respawn/xp_boost/potion_boost). Dado universal do jogo, recorrente por mes/dia (sem ano). Fonte: tibiawiki.com.br, levantado manualmente em 2026-08-17.';

alter table tibia_events enable row level security;

create policy "tibia_events_public_read" on tibia_events
  for select
  to anon, authenticated
  using (true);

insert into tibia_events (name, start_month, start_day, end_month, end_day, categories, description) values
  ('A Piece of Cake', 2, 21, 2, 26, array['xp_boost'], '+50% de experiência por 7 dias (exclusivo Premium) + regeneração de HP/mana 25% mais rápida.'),
  ('The Colours of Magic (Março)', 3, 15, 3, 23, array['xp_boost', 'potion_boost'], 'Servidor vota 1 de 3 bônus: Fern of Nature (poções de vida/mana +10%), Furb of Fun (XP compartilhada em party +30%), ou Feiz of Power (criaturas conjuradoras +25% XP + bônus de poção de skill). O resultado varia a cada edição.'),
  ('The Colours of Magic (Setembro)', 9, 15, 9, 23, array['xp_boost', 'potion_boost'], 'Segunda edição do ano do mesmo evento de março — servidor vota 1 de 3 bônus (Fern of Nature / Furb of Fun / Feiz of Power, ver edição de março para detalhes). O resultado varia a cada edição.'),
  ('Spring Into Life', 4, 16, 4, 23, array['xp_boost'], '+25% de experiência.'),
  ('Demon''s Lullaby', 5, 7, 5, 14, array['xp_boost'], '+50% de experiência (bônus válido até 21 de maio).'),
  ('Bewitched', 6, 21, 6, 25, array['xp_boost'], '+50% de experiência por 10 dias.'),
  ('The Great Expedition', 8, 5, 8, 18, array['rapid_respawn', 'xp_boost'], 'Servidor vota 2 opções por dia durante 7 dias de tarefas; todas as opções vencedoras ficam ativas juntas na semana de recompensa: Rapid Respawn (respawn dobrado), +5% a +20% de XP (geral, em party ou em bounty tasks), +15% loot, bônus de leech e mais. O resultado varia a cada edição.'),
  ('Rise of Devovorga', 9, 1, 9, 7, array['xp_boost'], '+15% de XP em criaturas Extra Dimensionais (bônus válido até 30 de setembro) + regeneração de HP/mana 50% mais rápida.'),
  ('Annual Autumn Vintage (1ª parte)', 10, 1, 10, 8, array['potion_boost'], 'Poções de cura e mana aprimoradas em 33% por 7 dias.'),
  ('Annual Autumn Vintage (2ª parte)', 10, 17, 10, 24, array['potion_boost'], 'Poções de cura e mana aprimoradas em 33% por mais 7 dias (se a 2ª etapa de coleta for concluída com sucesso).'),
  ('The Lightbearer', 11, 11, 11, 15, array['xp_boost'], '+10% de XP compartilhada em party (bônus válido até 30 de novembro).');
