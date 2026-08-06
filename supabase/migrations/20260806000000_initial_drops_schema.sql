-- ============================================================================
-- Tibia Party Manager — schema inicial (Drops + Serviceiros)
-- ============================================================================
-- Primeiro corte do schema relacional, focado na tabela de Drops (log de
-- itens raros) e sua relação N:N com Serviceiros — pedido do usuário em
-- 2026-08-06. `accounts` aqui é um placeholder mínimo só pra existir a FK;
-- trocar/expandir quando o Supabase Auth for integrado de verdade (ver
-- memória de projeto "integracao-api-futura" / "checkpoint-banco-mock").
--
-- Tabelas de outras entidades do app (members, hunts, bosses, splits) ainda
-- NÃO foram migradas — o app continua rodando 100% mock pra elas. Não fazer
-- INSERT/DELETE cruzado assumindo que essas tabelas existem.
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- accounts: workspace da party (placeholder até integrar Supabase Auth)
-- ----------------------------------------------------------------------------
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  party_name text not null,
  type text not null default 'party' check (type in ('party', 'solo')),
  created_at timestamptz not null default now()
);

comment on table accounts is 'Workspace da party. Placeholder mínimo — login/senha compartilhados ainda não foram migrados pro Supabase Auth.';

-- ----------------------------------------------------------------------------
-- serviceiros: agenda de contatos (nome + telefone — telefone nunca é exposto na UI)
-- ----------------------------------------------------------------------------
create table if not exists serviceiros (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  phone_number text not null,
  vocations text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_serviceiros_account on serviceiros(account_id);

comment on column serviceiros.vocations is 'Vocações atendidas (EK/ED/MS/RP/EM). Array de texto, não FK — é um enum de domínio fixo, não uma tabela.';

-- ----------------------------------------------------------------------------
-- drops: log de itens raros dropados pela party
-- ----------------------------------------------------------------------------
create table if not exists drops (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  data_drop date not null,
  ek text,
  ed text,
  ms text,
  rp text,
  quinto_player text,
  fragador text not null,
  item text not null,
  boss text not null,
  valor_cada bigint not null check (valor_cada >= 0),
  valor_total bigint not null check (valor_total >= 0),
  vendido boolean not null default false,
  data_venda date,
  created_at timestamptz not null default now(),
  constraint drops_data_venda_requires_vendido check (data_venda is null or vendido = true)
);

create index if not exists idx_drops_account_data on drops(account_id, data_drop);
create index if not exists idx_drops_boss on drops(boss);
create index if not exists idx_drops_fragador on drops(fragador);

comment on column drops.ek is 'Nome do char EK nesse drop — texto livre, não FK (tabela de members ainda não existe no Supabase).';
comment on column drops.valor_cada is 'Gold sempre é inteiro no Tibia — bigint em vez de numeric/decimal.';

-- ----------------------------------------------------------------------------
-- drop_services: "Service" como array de verdade — 1 linha por vaga coberta
-- por um Serviceiro num drop específico (relação N:N drops <-> serviceiros)
-- ----------------------------------------------------------------------------
create table if not exists drop_services (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid not null references drops(id) on delete cascade,
  serviceiro_id uuid not null references serviceiros(id) on delete restrict,
  vocacao text not null check (vocacao in ('EK', 'ED', 'MS', 'RP', 'EM')),
  created_at timestamptz not null default now(),
  unique (drop_id, vocacao) -- uma vaga só pode ter 1 serviceiro coberto por drop
);

create index if not exists idx_drop_services_drop on drop_services(drop_id);
create index if not exists idx_drop_services_serviceiro on drop_services(serviceiro_id);

comment on table drop_services is 'Um drop pode ter 0 a N serviceiros, cada um cobrindo uma vocação diferente. on delete restrict em serviceiro_id: não deixa apagar um Serviceiro que já está referenciado num drop histórico (apagar o Serviceiro exigiria antes remover/realocar os registros).';

-- ----------------------------------------------------------------------------
-- RLS — NÃO habilitado ainda
-- ----------------------------------------------------------------------------
-- Sem Supabase Auth integrado, não há como escrever policies que façam
-- sentido (não existe usuário autenticado pra comparar contra account_id).
-- Enquanto isso, a anon key tem acesso total — aceitável só em dev.
-- TODO: quando o Auth entrar, habilitar RLS + policies aqui:
-- alter table accounts enable row level security;
-- alter table serviceiros enable row level security;
-- alter table drops enable row level security;
-- alter table drop_services enable row level security;
