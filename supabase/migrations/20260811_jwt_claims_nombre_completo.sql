-- Inyecta tambien nombre_completo en los claims del JWT, junto a rol y organization_id,
-- para que el cliente pueda mostrar el nombre real del usuario sin una llamada extra.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  v_org uuid;
  v_rol text;
  v_nombre text;
begin
  select organization_id, rol::text, nombre_completo
    into v_org, v_rol, v_nombre
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

  if v_nombre is not null and v_nombre <> '' then
    claims := jsonb_set(claims, '{nombre_completo}', to_jsonb(v_nombre));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;
