-- Leen los claims inyectados por el auth hook. STABLE: cacheable por sentencia.
create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'organization_id', '')::uuid;
$$;

create or replace function public.current_rol()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'rol';
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'rol', '') = 'super_admin';
$$;
