-- ============================================================================
-- Tibia Party Manager — tabela de presets salvos da Roda de Destino
-- ============================================================================
-- Pedido do usuário em 2026-09-08: "ta pra deixar esse negocio da roda ainda
-- mais top poderiamos fazer uns cards em baixo da roda de preset salvos (na
-- tela tera o nome dado a roda e o lvl necessario - que seria a quantidade
-- de pontos + 50) ao clicar no card ele carrega a roda conforme salvo".
--
-- O port do tibia-wheel (ver migration 20260908000000 e o commit da virada,
-- 2026-09-05) removeu o salvamento de build antigo (IWheelBuildRepository) —
-- o estado da roda hoje é só o mesmo binário compacto (`contextToBinary` em
-- tibia-wheel-reference/src/utils.ts) que já vai no hash da URL pra
-- compartilhar link. Um preset salvo é literalmente esse binário + um nome +
-- o nível calculado (pontos investidos + 50) pra exibir no card, sem
-- reimplementar a estrutura antiga de allocations/vessels/gems.
--
-- NÃO inclui as gemas do Ateliê (gem-logic.ts) — elas já não são salvas no
-- hash da URL hoje (context.tsx: "fica só no estado local desta sessão, não
-- é salva no hash da URL"), então um preset carregado restaura a roda mas
-- não as gemas equipadas, mesma limitação já existente pro link compartilhável.
--
-- account_id/RLS seguem o mesmo padrão de drops/serviceiros/members/split_logs
-- (ver migration 20260814000000_enable_rls_with_auth.sql).
-- ============================================================================

create table if not exists wheel_presets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  vocation text not null,
  level int not null,
  state text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_wheel_presets_account on wheel_presets(account_id, created_at desc);

comment on column wheel_presets.level is 'Nível necessário pra ter os pontos investidos neste preset (pontos investidos + 50) — só pra exibir no card, recalculado no client a partir do state ao salvar.';
comment on column wheel_presets.state is 'Mesmo binário compacto usado no hash da URL (contextToBinary: level+vocation+perks) — carregar o preset só seta esse valor no hash, reaproveitando o parseHash/hashchange já existente no port.';

alter table wheel_presets enable row level security;

create policy "own_account_wheel_presets" on wheel_presets
  for all to authenticated
  using (account_id in (select id from accounts where user_id = auth.uid()))
  with check (account_id in (select id from accounts where user_id = auth.uid()));
