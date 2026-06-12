-- Security hardening for the user / invitation system.
--
-- Fixes three privilege-escalation issues found auditing the user module:
--   1. handle_new_user() trusted user-editable metadata (rol, organization_id),
--      so a public signUp could self-assign super_admin or join any org.
--   2. authenticated users could change their own profiles.rol / organization_id
--      via RLS (table-level UPDATE grant), self-promoting or jumping tenants;
--      a deactivated user could also re-set activo = true.
--   3. admin-provisioned users (createUser) re-triggered org auto-creation,
--      leaving orphan organizations.

-- 1 & 3 -----------------------------------------------------------------------
-- Never derive rol/organization_id from metadata. Backend-provisioned users
-- carry the 'app_created' marker (set via service_role); the backend inserts
-- their profile in the correct org, so the trigger must not provision anything.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_org_id uuid;
  v_nombre text := coalesce(new.raw_user_meta_data ->> 'nombre_completo', '');
begin
  if new.raw_user_meta_data ? 'app_created' then
    return new;
  end if;

  -- Public self-registration (prestamista): always a fresh org as 'admin'.
  insert into public.organizations (nombre_negocio, ciudad, telefono, estado_suscripcion, trial_hasta)
  values (
    coalesce(new.raw_user_meta_data ->> 'nombre_negocio', ''),
    new.raw_user_meta_data ->> 'ciudad',
    new.raw_user_meta_data ->> 'telefono',
    'trial',
    (now() + interval '15 days')::date
  )
  returning id into v_org_id;

  insert into public.profiles (id, organization_id, nombre_completo, rol)
  values (new.id, v_org_id, v_nombre, 'admin')
  on conflict (id) do nothing;

  return new;
end;
$function$;

-- 2a --------------------------------------------------------------------------
-- The prior privileges were table-level (all columns). Revoke them and re-grant
-- only the columns a client legitimately writes. rol / organization_id are now
-- writable exclusively through service_role (which bypasses column grants).
revoke insert, update on public.profiles from authenticated, anon;
grant update (nombre_completo, telefono, activo) on public.profiles to authenticated;

-- 2b --------------------------------------------------------------------------
-- Defense in depth: a user may never alter privileged fields on their OWN
-- profile (covers self-reactivation of `activo`, which still has a column grant
-- because admins toggle it on OTHER users' rows). service_role has no auth.uid().
create or replace function public.prevent_profile_self_privilege_change()
returns trigger
language plpgsql
security invoker
set search_path to 'public'
as $function$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if new.id = (select auth.uid()) then
    if new.rol is distinct from old.rol
       or new.organization_id is distinct from old.organization_id
       or new.activo is distinct from old.activo then
      raise exception 'No autorizado: no puedes modificar rol, organización ni estado de tu propia cuenta';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_prevent_profile_self_privilege_change on public.profiles;
create trigger trg_prevent_profile_self_privilege_change
  before update on public.profiles
  for each row execute function public.prevent_profile_self_privilege_change();
