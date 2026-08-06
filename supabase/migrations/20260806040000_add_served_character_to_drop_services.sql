-- ============================================================================
-- Adiciona `served_character_name` em drop_services: qual char (dentre
-- EK/ED/MS/RP/5º daquele drop) o serviceiro efetivamente serviu — diferente de
-- `vocacao` (que só marca a vaga/tipo), isso rastreia a pessoa de verdade.
-- Nullable: nenhum vínculo histórico tem esse dado, preenchido daqui pra frente
-- só quando o usuário editar/registrar o drop no formulário.
-- ============================================================================

alter table drop_services add column if not exists served_character_name text;

comment on column drop_services.served_character_name is 'Nome do char (EK/ED/MS/RP/5º daquele drop específico) que o serviceiro serviu — rastreabilidade de quem fez o service pra quem, distinto de `vocacao` (que é só a categoria da vaga).';
