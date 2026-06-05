-- Activar y forzar RLS en todas las tablas
alter table public.organizations    enable row level security;
alter table public.organizations    force row level security;
alter table public.profiles          enable row level security;
alter table public.profiles          force row level security;
alter table public.clientes          enable row level security;
alter table public.clientes          force row level security;
alter table public.prestamos         enable row level security;
alter table public.prestamos         force row level security;
alter table public.cronograma_pagos  enable row level security;
alter table public.cronograma_pagos  force row level security;
alter table public.mora_registros    enable row level security;
alter table public.mora_registros    force row level security;
alter table public.cierres_caja      enable row level security;
alter table public.cierres_caja      force row level security;

-- ============ organizations ============
create policy organizations_select on public.organizations
  for select to authenticated
  using (id = public.current_org_id() or public.is_super_admin());

create policy organizations_update on public.organizations
  for update to authenticated
  using ((id = public.current_org_id() and public.current_rol() = 'admin') or public.is_super_admin())
  with check ((id = public.current_org_id() and public.current_rol() = 'admin') or public.is_super_admin());

create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (public.is_super_admin());

create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.is_super_admin());

-- ============ profiles ============
create policy profiles_select on public.profiles
  for select to authenticated
  using (organization_id = public.current_org_id() or id = auth.uid() or public.is_super_admin());

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

create policy profiles_update on public.profiles
  for update to authenticated
  using (public.is_super_admin()
         or id = auth.uid()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin()
              or id = auth.uid()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

create policy profiles_delete on public.profiles
  for delete to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

-- ============ clientes ============
create policy clientes_select on public.clientes
  for select to authenticated
  using (public.is_super_admin() or organization_id = public.current_org_id());

create policy clientes_write on public.clientes
  for all to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

-- ============ prestamos ============
create policy prestamos_select on public.prestamos
  for select to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id()
             and (public.current_rol() = 'admin'
                  or (public.current_rol() = 'cobrador' and cobrador_id = auth.uid()))));

create policy prestamos_write on public.prestamos
  for all to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

-- ============ cronograma_pagos ============
create policy cronograma_select on public.cronograma_pagos
  for select to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id()
             and (public.current_rol() = 'admin'
                  or (public.current_rol() = 'cobrador' and cobrador_id = auth.uid()))));

-- El cobrador puede ACTUALIZAR (registrar pago) solo sus cuotas
create policy cronograma_update on public.cronograma_pagos
  for update to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id()
             and (public.current_rol() = 'admin'
                  or (public.current_rol() = 'cobrador' and cobrador_id = auth.uid()))))
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id()
                  and (public.current_rol() = 'admin'
                       or (public.current_rol() = 'cobrador' and cobrador_id = auth.uid()))));

-- Crear/borrar cuotas: solo admin (se generan al crear el préstamo)
create policy cronograma_insert on public.cronograma_pagos
  for insert to authenticated
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

create policy cronograma_delete on public.cronograma_pagos
  for delete to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

-- ============ mora_registros ============
create policy mora_select on public.mora_registros
  for select to authenticated
  using (public.is_super_admin() or organization_id = public.current_org_id());

create policy mora_write on public.mora_registros
  for all to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

-- ============ cierres_caja ============
create policy cierres_select on public.cierres_caja
  for select to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id()
             and (public.current_rol() = 'admin'
                  or (public.current_rol() = 'cobrador' and cobrador_id = auth.uid()))));

-- Cobrador puede crear su cierre de ruta; admin todo
create policy cierres_insert on public.cierres_caja
  for insert to authenticated
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id()
                  and public.current_rol() in ('admin', 'cobrador')));

create policy cierres_modify on public.cierres_caja
  for update to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

create policy cierres_delete on public.cierres_caja
  for delete to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));
