-- public.pagos only ever got SELECT and INSERT policies (20260605_rls_private_helpers_and_index_cleanup.sql).
-- The PATCH/DELETE /api/pagos/[id] routes are admin-gated in application code, but with RLS
-- forced and no UPDATE policy, those writes silently match zero rows: the API call succeeds,
-- but nothing changes.
--
-- "Anular pago" is implemented as a soft-delete (anulado_at/anulado_por) rather than a hard
-- DELETE so the payment stays on record for audit purposes. Cobradores may anular a payment
-- they themselves registered; admins/super_admins may anular any payment in their org.

alter table public.pagos
  add column if not exists anulado_at timestamptz,
  add column if not exists anulado_por uuid references public.profiles(id);

drop policy if exists pagos_update_admin_or_owner on public.pagos;
create policy pagos_update_admin_or_owner on public.pagos
  for update to authenticated
  using (
    (select private.is_super_admin())
    or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin')
    or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'cobrador' and registrado_por = (select auth.uid()))
  )
  with check (
    (select private.is_super_admin())
    or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin')
    or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'cobrador' and registrado_por = (select auth.uid()))
  );
