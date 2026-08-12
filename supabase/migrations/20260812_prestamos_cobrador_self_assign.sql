-- Cobradores may now create prestamos, but only self-assigned to themselves
-- (the API route always forces cobrador_id = actor.userId for a cobrador
-- actor, ignoring any other value). Admins/super_admins keep unrestricted
-- create access, same as before.

drop policy if exists prestamos_insert_admin on public.prestamos;
create policy prestamos_insert_authorized on public.prestamos
  for insert to authenticated
  with check (
    (select private.is_super_admin())
    or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin')
    or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'cobrador' and cobrador_id = (select auth.uid()))
  );
