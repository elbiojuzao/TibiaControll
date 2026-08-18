-- ============================================================================
-- Script de AUDITORIA (só leitura, não altera nada) — nomes distintos usados
-- em "5º Player" (drops.quinto_player) e em "jogador servido" pelo serviceiro
-- (drop_services.served_character_name), com contagem de ocorrências.
--
-- Objetivo (pedido do usuário em 2026-08-17): achar nomes inconsistentes —
-- ex: "Zo Tis" (boneco, formato antigo) vs "Zotis" (nome real, formato usado
-- desde a correção do 5º Player em 2026-08-16) representando a MESMA pessoa,
-- ou nomes com erro de digitação/espaço a mais.
--
-- Cola no SQL Editor do Supabase e roda. Não cria nada no banco (não é uma
-- tabela de verdade, é só uma consulta usando CTEs — "tabela temporária" só
-- na visualização do resultado). Ajuste o account_id no WHERE se quiser
-- auditar uma conta específica; sem filtro, olha TODAS as contas do banco.
-- ============================================================================

with quinto_player_names as (
  select
    quinto_player as nome,
    'quinto_player (5º Player)' as origem,
    count(*) as ocorrencias
  from drops
  where quinto_player is not null and quinto_player <> ''
  group by quinto_player
),

served_character_names as (
  select
    served_character_name as nome,
    'served_character_name (jogador servido pelo serviceiro)' as origem,
    count(*) as ocorrencias
  from drop_services
  where served_character_name is not null and served_character_name <> ''
  group by served_character_name
),

todos_os_nomes as (
  select * from quinto_player_names
  union all
  select * from served_character_names
)

select
  t.nome,
  t.origem,
  t.ocorrencias,
  s_por_nome.id is not null as bate_com_nome_de_serviceiro,
  s_por_boneco.id is not null as bate_com_boneco_de_serviceiro,
  coalesce(s_por_nome.name, s_por_boneco.name) as serviceiro_correspondente,
  coalesce(s_por_nome.character_name, s_por_boneco.character_name) as boneco_correspondente
from todos_os_nomes t
left join serviceiros s_por_nome on s_por_nome.name = t.nome
left join serviceiros s_por_boneco on s_por_boneco.character_name = t.nome
order by
  -- nomes que não batem com NADA no cadastro de serviceiros aparecem primeiro
  -- (candidatos mais fortes a erro de digitação/nome órfão)
  (s_por_nome.id is null and s_por_boneco.id is null) desc,
  t.nome,
  t.origem;
