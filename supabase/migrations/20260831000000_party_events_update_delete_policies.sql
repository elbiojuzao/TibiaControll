-- ============================================================================
-- party_events: policies de update/delete (mesmo modelo admin-only do insert)
-- ============================================================================
-- Pedido do usuário em 2026-08-31: "podemos reutilizar [a modal] para excluir
-- um evento ou editar evento... mostrar um historico dos ultimos 5 eventos
-- para caso usuario precise remover ou editar". Até aqui party_events só
-- tinha select aberto (migration 20260828000000) e insert admin-only —
-- faltavam update/delete.
--
-- Decisão: qualquer conta admin pode editar/excluir QUALQUER evento do mural
-- (não só os que ela mesma criou) — mesmo espírito de "select aberto pra
-- todo mundo" da migration anterior, só que a escrita fica restrita a admin
-- em vez de aberta a todo autenticado.
-- ============================================================================

create policy "party_events_update_admin_only" on party_events
  for update to authenticated
  using (exists (select 1 from accounts where user_id = auth.uid() and is_admin = true))
  with check (exists (select 1 from accounts where user_id = auth.uid() and is_admin = true));

create policy "party_events_delete_admin_only" on party_events
  for delete to authenticated
  using (exists (select 1 from accounts where user_id = auth.uid() and is_admin = true));
