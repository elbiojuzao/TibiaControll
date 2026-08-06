-- ============================================================================
-- Adiciona `character_name` (nome do boneco usado pra receber o pagamento)
-- na tabela `serviceiros`. Nullable porque os 22 registros já importados da
-- planilha de histórico não têm esse dado — preenchido manualmente depois,
-- igual ao `phone_number` placeholder (ver memória "integracao-supabase").
-- ============================================================================

alter table serviceiros add column if not exists character_name text;

comment on column serviceiros.character_name is 'Nome do char (boneco) usado para receber o pagamento do serviço — pode ser diferente do apelido/nome da pessoa.';
