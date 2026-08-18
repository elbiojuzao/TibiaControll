-- ============================================================================
-- Correção dos nomes do "Zotis" (2026-08-17) — achado pela auditoria de
-- 5º Player/serviceiro. Cobre só o que está 100% confirmado; "Wispin" e
-- "Kev Prime" ficam de fora até você confirmar o que são.
--
-- Causa raiz: o registro de serviceiro (id 09e423df-b7c1-48c5-bd97-72125466dfea)
-- está com o campo "Nome" igual ao "Boneco" (name = character_name = "Zo Tis"),
-- quando o correto é name = "Zotis" (nome real da pessoa) e
-- character_name = "Zo Tis" (boneco, usado só pra pagamento). Isso fazia o
-- "Zotis" que aparece 143x no 5º Player não bater com nenhum serviceiro
-- cadastrado.
--
-- Roda o bloco inteiro de uma vez (um único "Run" no SQL Editor) — as 2
-- atualizações e a conferência final rodam juntas, atômico (se algo falhar
-- no meio, nada é salvo). Confere o resultado da última consulta depois de
-- rodar: deve aparecer só 1 linha, "Zotis", com 155 ocorrências.
-- ============================================================================

begin;

-- 1) Corrige o nome do serviceiro (o Boneco "Zo Tis" continua igual, não mexe nisso)
update serviceiros
set name = 'Zotis'
where id = '09e423df-b7c1-48c5-bd97-72125466dfea';

-- 2) Normaliza os registros ANTIGOS de "5º Player" que ainda guardam o boneco
--    (formato de antes da correção de 2026-08-16) ou variações de digitação
--    em minúsculo, todos apontando pra mesma pessoa — vira só "Zotis" daqui pra frente.
update drops
set quinto_player = 'Zotis'
where quinto_player in ('Zo Tis', 'zo tis', 'zotis');

commit;

-- Conferência pós-fix — deve mostrar só "Zotis" com 155 ocorrências (143+9+2+1).
select quinto_player, count(*) as ocorrencias
from drops
where quinto_player ilike '%zo%tis%'
group by quinto_player;
