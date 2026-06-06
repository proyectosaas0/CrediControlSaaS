-- Harden audit_action search_path.

create or replace function public.audit_action(
  p_organization_id uuid,
  p_actor_id uuid,
  p_actor_rol text,
  p_accion text,
  p_entidad text,
  p_entidad_id uuid default null,
  p_estado_anterior jsonb default null,
  p_estado_nuevo jsonb default null,
  p_ip inet default null,
  p_user_agent text default null
)
returns void
language plpgsql
set search_path = 'public'
as $$
begin
  insert into public.audit_logs (
    organization_id,
    actor_id,
    actor_rol,
    accion,
    entidad,
    entidad_id,
    estado_anterior,
    estado_nuevo,
    ip,
    user_agent,
    created_at
  ) values (
    p_organization_id,
    p_actor_id,
    p_actor_rol,
    p_accion,
    p_entidad,
    p_entidad_id,
    p_estado_anterior,
    p_estado_nuevo,
    p_ip,
    p_user_agent,
    now()
  );
end;
$$;

revoke execute on function public.audit_action(uuid, uuid, text, text, text, uuid, jsonb, jsonb, inet, text) from public, anon;
grant execute on function public.audit_action(uuid, uuid, text, text, text, uuid, jsonb, jsonb, inet, text) to authenticated, service_role;

notify pgrst, 'reload schema';
