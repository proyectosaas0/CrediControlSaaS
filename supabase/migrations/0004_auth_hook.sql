-- Inyecta organization_id y rol en los claims del JWT en cada emisión de token.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  v_org uuid;
  v_rol text;
begin
  select organization_id, rol::text
    into v_org, v_rol
  from public.profiles
  where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);

  if v_rol is not null then
    claims := jsonb_set(claims, '{rol}', to_jsonb(v_rol));
  end if;

  if v_org is not null then
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(v_org));
  else
    claims := jsonb_set(claims, '{organization_id}', 'null'::jsonb);
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- El hook corre como supabase_auth_admin: necesita ejecutar la función y leer profiles.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on table public.profiles to supabase_auth_admin;

-- Permitir que supabase_auth_admin lea profiles pese a RLS forzado
create policy profiles_auth_admin_read on public.profiles
  for select to supabase_auth_admin
  using (true);

-- No exponer el hook a roles de cliente
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
