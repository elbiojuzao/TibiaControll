-- ============================================================================
-- Tibia Party Manager — Vendedor Padrão (members.is_default_seller)
-- ============================================================================
-- Bug reportado pelo usuário em 2026-08-16: o card "Copiar Comandos de
-- Transferência" (DropFormModal, ver migration/feature de 2026-08-15) usava o
-- Fragador (quem looted o item) como "quem paga" — mas na prática é sempre um
-- membro fixo da party que vende tudo (ex: Thanatos), independente de quem
-- fragou. `is_default_seller` marca esse membro; a UI de Configurações passa
-- a ter um checkbox "Vendedor Padrão" (no máximo 1 marcado por conta).
--
-- O índice único parcial abaixo garante isso a nível de banco — o app faz um
-- "unset" no membro antigo antes de marcar o novo (ver SettingsPage.tsx), mas
-- a constraint evita qualquer estado inconsistente mesmo se essa lógica falhar.
-- ============================================================================

alter table members add column if not exists is_default_seller boolean not null default false;

create unique index if not exists members_one_default_seller_per_account
  on members(account_id)
  where is_default_seller = true;

comment on column members.is_default_seller is 'Membro que efetivamente vende os itens (visita NPC/Market) e por isso é quem "paga" nos comandos de transferência do drop vendido — independente de quem looted (Fragador). No máximo 1 por conta (ver índice único parcial acima).';

-- Seed: Thanatos Celestial é o vendedor real da PT existente (Thanatos PT).
update members
set is_default_seller = true
where account_id = '7206010b-977b-4a8b-a48a-f3a073b9c917'
  and character_name = 'Thanatos Celestial';
