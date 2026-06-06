-- Restrict payment and balance policies to authenticated users.

drop policy if exists pagos_insert_all on public.pagos;
drop policy if exists pagos_select_tenant on public.pagos;

create policy pagos_select_tenant on public.pagos
  for select to authenticated
  using (
    public.is_super_admin()
    or organization_id = public.current_org_id()
  );

create policy pagos_insert_authorized on public.pagos
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (
      organization_id = public.current_org_id()
      and (
        public.current_rol() = 'admin'
        or (
          public.current_rol() = 'cobrador'
          and cobrador_id = (select auth.uid())
          and registrado_por = (select auth.uid())
        )
      )
    )
  );

drop policy if exists prestamo_saldos_select on public.prestamo_saldos;
drop policy if exists prestamo_saldos_update_admin on public.prestamo_saldos;

create policy prestamo_saldos_select on public.prestamo_saldos
  for select to authenticated
  using (
    public.is_super_admin()
    or organization_id = public.current_org_id()
  );

create policy prestamo_saldos_update_authorized on public.prestamo_saldos
  for update to authenticated
  using (
    public.is_super_admin()
    or (
      organization_id = public.current_org_id()
      and public.current_rol() = 'admin'
    )
    or exists (
      select 1
      from public.prestamos p
      where p.id = prestamo_id
        and p.organization_id = public.current_org_id()
        and p.cobrador_id = (select auth.uid())
    )
  )
  with check (
    public.is_super_admin()
    or organization_id = public.current_org_id()
  );
