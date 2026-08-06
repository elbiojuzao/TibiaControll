-- ============================================================================
-- O Supabase habilitou RLS automaticamente nas 4 tabelas ao criá-las (padrão
-- de segurança do dashboard), bloqueando todo INSERT/UPDATE mesmo com a
-- publishable key — descoberto na prática ao tentar importar o histórico de
-- drops em 2026-08-06 (erro 42501 "new row violates row-level security
-- policy"). Como ainda não existe Supabase Auth integrado, não há usuário
-- autenticado pra escrever policies que façam sentido — desabilitando RLS
-- explicitamente até isso ser resolvido (ver TODO na migration inicial e
-- memória "integracao-supabase").
-- ============================================================================

alter table accounts disable row level security;
alter table serviceiros disable row level security;
alter table drops disable row level security;
alter table drop_services disable row level security;
