-- Make RLS helpers independent from custom JWT claims.

create or replace function public.current_org_id()
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

create or replace function public.current_rol()
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

create or replace function public.is_super_admin()
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

revoke execute on function public.current_org_id() from public, anon;
revoke execute on function public.current_rol() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.current_org_id() to authenticated, service_role;
grant execute on function public.current_rol() to authenticated, service_role;
grant execute on function public.is_super_admin() to authenticated, service_role;
