-- ============================================================================
-- Segunda leva de correções da auditoria de 5º Player/serviceiro (2026-08-17).
--
-- 1) "Wispin" (1 ocorrência em drops.quinto_player) confirmado pelo usuário
--    como digitação errada de "Whisp" (serviceiro já cadastrado) — normaliza.
--
-- 2) "Kev Prime" (18 ocorrências em drops.quinto_player) confirmado como um
--    serviceiro que nunca foi cadastrado — cria o registro (vocações MS+RP,
--    confirmado pelo usuário). Boneco (character_name) e telefone
--    (phone_number) ficam em branco de propósito — não foram informados, e
--    inventar um valor aqui seria repetir o mesmo tipo de erro que acabamos
--    de corrigir no Zotis (campo errado com dado inventado). Dá pra
--    preencher depois normalmente pela modal de "Editar Serviceiro".
--
-- Roda o bloco inteiro de uma vez (um único "Run" no SQL Editor).
-- ============================================================================

begin;

-- 1) Normaliza "Wispin" -> "Whisp"
update drops
set quinto_player = 'Whisp'
where quinto_player = 'Wispin';

-- 2) Cria o serviceiro Kev Prime (MS + RP), sem boneco/telefone ainda.
--    account_id vem dos próprios drops que já citam "Kev Prime" (em vez de
--    assumir que só existe 1 conta no banco) — garante que o serviceiro
--    nasce na conta certa mesmo se um dia existir mais de uma party.
insert into serviceiros (account_id, name, character_name, phone_number, vocations)
select distinct account_id, 'Kev Prime', '', '', array['MS', 'RP']
from drops
where quinto_player = 'Kev Prime';

commit;

-- Conferência pós-fix:
select quinto_player, count(*) as ocorrencias
from drops
where quinto_player in ('Wispin', 'Whisp')
group by quinto_player;

select id, name, character_name, phone_number, vocations
from serviceiros
where name = 'Kev Prime';
