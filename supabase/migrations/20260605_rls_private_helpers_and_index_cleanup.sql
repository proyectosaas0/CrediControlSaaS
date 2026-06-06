create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = 'public'
as $$
  select p.organization_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.activo = true
$$;

create or replace function private.current_rol()
returns text
language sql
stable
security definer
set search_path = 'public'
as $$
  select p.rol::text
  from public.profiles p
  where p.id = (select auth.uid())
    and p.activo = true
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select coalesce((
    select p.rol = 'super_admin'::public.rol
    from public.profiles p
    where p.id = (select auth.uid())
      and p.activo = true
  ), false)
$$;

revoke execute on function private.current_org_id() from public, anon;
revoke execute on function private.current_rol() from public, anon;
revoke execute on function private.is_super_admin() from public, anon;
grant execute on function private.current_org_id() to authenticated, service_role;
grant execute on function private.current_rol() to authenticated, service_role;
grant execute on function private.is_super_admin() to authenticated, service_role;

-- Replace helper-based policies with initplan-safe calls to private helpers.
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (id = (select private.current_org_id()) or (select private.is_super_admin()));

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update to authenticated
  using (((id = (select private.current_org_id())) and ((select private.current_rol()) = 'admin')) or (select private.is_super_admin()))
  with check (((id = (select private.current_org_id())) and ((select private.current_rol()) = 'admin')) or (select private.is_super_admin()));

drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check ((select private.is_super_admin()));

drop policy if exists organizations_delete on public.organizations;
create policy organizations_delete on public.organizations
  for delete to authenticated
  using ((select private.is_super_admin()));

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (organization_id = (select private.current_org_id()) or id = (select auth.uid()) or (select private.is_super_admin()));

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using ((select private.is_super_admin()) or id = (select auth.uid()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'))
  with check ((select private.is_super_admin()) or id = (select auth.uid()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));

drop policy if exists clientes_write on public.clientes;
drop policy if exists clientes_select on public.clientes;
create policy clientes_select on public.clientes
  for select to authenticated
  using ((select private.is_super_admin()) or organization_id = (select private.current_org_id()));
create policy clientes_insert_admin on public.clientes
  for insert to authenticated
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));
create policy clientes_update_admin on public.clientes
  for update to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'))
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));
create policy clientes_delete_admin on public.clientes
  for delete to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));

drop policy if exists prestamos_write on public.prestamos;
drop policy if exists prestamos_select on public.prestamos;
create policy prestamos_select on public.prestamos
  for select to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and ((select private.current_rol()) = 'admin' or ((select private.current_rol()) = 'cobrador' and cobrador_id = (select auth.uid())))));
create policy prestamos_insert_admin on public.prestamos
  for insert to authenticated
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));
create policy prestamos_update_admin on public.prestamos
  for update to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'))
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));
create policy prestamos_delete_admin on public.prestamos
  for delete to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));

drop policy if exists cronograma_select on public.cronograma_pagos;
create policy cronograma_select on public.cronograma_pagos
  for select to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and ((select private.current_rol()) = 'admin' or ((select private.current_rol()) = 'cobrador' and cobrador_id = (select auth.uid())))));

drop policy if exists cronograma_update on public.cronograma_pagos;
create policy cronograma_update on public.cronograma_pagos
  for update to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and ((select private.current_rol()) = 'admin' or ((select private.current_rol()) = 'cobrador' and cobrador_id = (select auth.uid())))))
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and ((select private.current_rol()) = 'admin' or ((select private.current_rol()) = 'cobrador' and cobrador_id = (select auth.uid())))));

drop policy if exists cronograma_insert on public.cronograma_pagos;
create policy cronograma_insert on public.cronograma_pagos
  for insert to authenticated
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));

drop policy if exists cronograma_delete on public.cronograma_pagos;
create policy cronograma_delete on public.cronograma_pagos
  for delete to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));

drop policy if exists pagos_select_tenant on public.pagos;
create policy pagos_select_tenant on public.pagos
  for select to authenticated
  using ((select private.is_super_admin()) or organization_id = (select private.current_org_id()));

drop policy if exists pagos_insert_authorized on public.pagos;
create policy pagos_insert_authorized on public.pagos
  for insert to authenticated
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and ((select private.current_rol()) = 'admin' or ((select private.current_rol()) = 'cobrador' and cobrador_id = (select auth.uid()) and registrado_por = (select auth.uid())))));

drop policy if exists prestamo_saldos_select on public.prestamo_saldos;
create policy prestamo_saldos_select on public.prestamo_saldos
  for select to authenticated
  using ((select private.is_super_admin()) or organization_id = (select private.current_org_id()));

drop policy if exists prestamo_saldos_update_authorized on public.prestamo_saldos;
create policy prestamo_saldos_update_authorized on public.prestamo_saldos
  for update to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin') or exists (select 1 from public.prestamos p where p.id = prestamo_saldos.prestamo_id and p.organization_id = (select private.current_org_id()) and p.cobrador_id = (select auth.uid())))
  with check ((select private.is_super_admin()) or organization_id = (select private.current_org_id()));

drop policy if exists mora_write on public.mora_registros;
drop policy if exists mora_select on public.mora_registros;
create policy mora_select on public.mora_registros
  for select to authenticated
  using ((select private.is_super_admin()) or organization_id = (select private.current_org_id()));
create policy mora_insert_admin on public.mora_registros
  for insert to authenticated
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));
create policy mora_update_admin on public.mora_registros
  for update to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'))
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));
create policy mora_delete_admin on public.mora_registros
  for delete to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));

drop policy if exists audit_logs_select_own_org on public.audit_logs;
create policy audit_logs_select_own_org on public.audit_logs
  for select to authenticated
  using ((select private.is_super_admin()) or organization_id = (select private.current_org_id()));

drop policy if exists cierres_select on public.cierres_caja;
create policy cierres_select on public.cierres_caja
  for select to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and ((select private.current_rol()) = 'admin' or ((select private.current_rol()) = 'cobrador' and cobrador_id = (select auth.uid())))));

drop policy if exists cierres_insert on public.cierres_caja;
create policy cierres_insert on public.cierres_caja
  for insert to authenticated
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = any (array['admin','cobrador'])));

drop policy if exists cierres_modify on public.cierres_caja;
create policy cierres_modify on public.cierres_caja
  for update to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'))
  with check ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));

drop policy if exists cierres_delete on public.cierres_caja;
create policy cierres_delete on public.cierres_caja
  for delete to authenticated
  using ((select private.is_super_admin()) or (organization_id = (select private.current_org_id()) and (select private.current_rol()) = 'admin'));

-- Policies that directly referenced auth.uid() in subqueries.
drop policy if exists subscription_plans_select_all on public.subscription_plans;
create policy subscription_plans_select_all on public.subscription_plans
  for select to public
  using (activo = true or exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.rol = 'super_admin'::public.rol));

drop policy if exists tenant_settings_select_admin on public.tenant_settings;
create policy tenant_settings_select_admin on public.tenant_settings
  for select to public
  using (organization_id in (select organizations.id from public.organizations join public.profiles on profiles.organization_id = organizations.id where profiles.id = (select auth.uid()) and (profiles.rol = 'admin'::public.rol or profiles.rol = 'super_admin'::public.rol)));

drop policy if exists tenant_settings_update_admin on public.tenant_settings;
create policy tenant_settings_update_admin on public.tenant_settings
  for update to public
  using (organization_id in (select organizations.id from public.organizations join public.profiles on profiles.organization_id = organizations.id where profiles.id = (select auth.uid()) and profiles.rol = 'admin'::public.rol));

drop policy if exists tenant_subscriptions_select_admin on public.tenant_subscriptions;
create policy tenant_subscriptions_select_admin on public.tenant_subscriptions
  for select to public
  using ((select private.is_super_admin()) or organization_id in (select profiles.organization_id from public.profiles where profiles.id = (select auth.uid())));

drop policy if exists tenant_subscriptions_insert_admin on public.tenant_subscriptions;
create policy tenant_subscriptions_insert_admin on public.tenant_subscriptions
  for insert to public
  with check ((select private.is_super_admin()));

drop policy if exists tenant_subscriptions_update_admin on public.tenant_subscriptions;
create policy tenant_subscriptions_update_admin on public.tenant_subscriptions
  for update to public
  using ((select private.is_super_admin()) or organization_id in (select profiles.organization_id from public.profiles where profiles.id = (select auth.uid()) and profiles.rol = 'admin'::public.rol));

drop policy if exists subscription_payments_select_admin on public.subscription_payments;
create policy subscription_payments_select_admin on public.subscription_payments
  for select to public
  using ((select private.is_super_admin()) or organization_id in (select profiles.organization_id from public.profiles where profiles.id = (select auth.uid())));

drop policy if exists subscription_payments_insert_admin on public.subscription_payments;
create policy subscription_payments_insert_admin on public.subscription_payments
  for insert to public
  with check ((select private.is_super_admin()));

drop policy if exists notification_events_select_own on public.notification_events;
create policy notification_events_select_own on public.notification_events
  for select to public
  using ((select private.is_super_admin()) or organization_id in (select profiles.organization_id from public.profiles where profiles.id = (select auth.uid())) or user_id = (select auth.uid()));

drop policy if exists notification_events_insert_admin on public.notification_events;
create policy notification_events_insert_admin on public.notification_events
  for insert to public
  with check ((select private.is_super_admin()) or organization_id in (select profiles.organization_id from public.profiles where profiles.id = (select auth.uid()) and profiles.rol = 'admin'::public.rol));

drop policy if exists visitas_select_tenant on public.visitas_cobro;
create policy visitas_select_tenant on public.visitas_cobro
  for select to public
  using (organization_id in (select profiles.organization_id from public.profiles where profiles.id = (select auth.uid())));

drop policy if exists visitas_insert_all on public.visitas_cobro;
create policy visitas_insert_all on public.visitas_cobro
  for insert to public
  with check (organization_id in (select profiles.organization_id from public.profiles where profiles.id = (select auth.uid())) and (cobrador_id = (select auth.uid()) or exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.rol = 'admin'::public.rol)));

-- Remove exposed public helper RPCs now that policies use private helpers.
drop function if exists public.current_org_id();
drop function if exists public.current_rol();
drop function if exists public.is_super_admin();

-- Missing FK indexes from the performance advisor.
create index if not exists idx_mora_registros_prestamo_id on public.mora_registros (prestamo_id);
create index if not exists idx_pagos_cobrador_id on public.pagos (cobrador_id);
create index if not exists idx_pagos_cronograma_pago_id on public.pagos (cronograma_pago_id);
create index if not exists idx_pagos_registrado_por on public.pagos (registrado_por);
create index if not exists idx_prestamos_created_by on public.prestamos (created_by);
create index if not exists idx_prestamos_prestamo_anterior_id on public.prestamos (prestamo_anterior_id);
create index if not exists idx_subscription_payments_subscription_id on public.subscription_payments (subscription_id);
create index if not exists idx_tenant_subscriptions_plan_id on public.tenant_subscriptions (plan_id);
create index if not exists idx_visitas_cobro_cliente_id on public.visitas_cobro (cliente_id);
create index if not exists idx_visitas_cobro_cobrador_id on public.visitas_cobro (cobrador_id);
create index if not exists idx_visitas_cobro_cronograma_pago_id on public.visitas_cobro (cronograma_pago_id);
create index if not exists idx_visitas_cobro_prestamo_id on public.visitas_cobro (prestamo_id);

-- Drop exact duplicate indexes while keeping the descriptive *_id variants.
drop index if exists public.idx_clientes_org;
drop index if exists public.idx_prestamos_cliente;
drop index if exists public.idx_prestamos_org;
drop index if exists public.idx_profiles_org;

notify pgrst, 'reload schema';
