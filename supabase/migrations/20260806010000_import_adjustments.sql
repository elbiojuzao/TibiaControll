-- ============================================================================
-- Ajustes pra importar o histórico real de drops (planilha drops.xlsx, 485
-- linhas, 2026-08-06). Dados reais revelaram que a migration inicial estava
-- otimista demais em alguns NOT NULL — ver memória "integracao-supabase".
-- ============================================================================

-- Fragador nem sempre existe: drops de baú compartilhado (Plunder, SoulCore)
-- não têm 1 looter individual.
alter table drops alter column fragador drop not null;

-- service_raw: texto cru da coluna "Service" da planilha original, preservado
-- sem tentar normalizar (nomes com erro de digitação, maiúsculas
-- inconsistentes, às vezes 2 pessoas na mesma célula). drop_services continua
-- sendo a fonte de verdade estruturada; isso aqui é só auditoria/histórico.
alter table drops add column if not exists service_raw text;

comment on column drops.service_raw is 'Texto original da coluna Service da planilha importada — não normalizado, só pra auditoria. A relação estruturada fica em drop_services.';

-- vocação nem sempre é conhecida no momento da importação (planilha antiga
-- não registrava qual vaga o serviceiro cobriu) — permite NULL até alguém
-- preencher manualmente depois. unique(drop_id, vocacao) continua funcionando
-- normalmente com múltiplos NULLs no mesmo drop_id (semântica padrão de NULL
-- em unique constraints do Postgres).
alter table drop_services alter column vocacao drop not null;
