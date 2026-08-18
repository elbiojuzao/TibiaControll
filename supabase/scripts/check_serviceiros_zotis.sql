-- Diagnóstico rápido (só leitura) — conferir se existe mais de um registro de
-- serviceiro relacionado a "Zotis"/"Zo Tis" (nome duplicado, boneco duplicado,
-- espaço a mais escondido etc), e ver o estado exato de cada campo.
select
  id,
  name,
  length(name) as tamanho_nome,
  character_name,
  length(character_name) as tamanho_boneco,
  hidden,
  created_at
from serviceiros
where name ilike '%zo%tis%' or character_name ilike '%zo%tis%'
order by created_at;
