drop policy if exists clientes_insert_admin on public.clientes;
create policy clientes_insert on public.clientes
  for insert to authenticated
  with check (
    (select private.is_super_admin())
    or (
      organization_id = (select private.current_org_id())
      and (select private.current_rol()) in ('admin', 'cobrador')
    )
  );
