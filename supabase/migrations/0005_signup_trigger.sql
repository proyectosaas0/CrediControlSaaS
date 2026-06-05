create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_rol public.rol;
  v_nombre text := coalesce(new.raw_user_meta_data ->> 'nombre_completo', '');
begin
  if new.raw_user_meta_data ? 'organization_id' then
    -- Cobrador (u otro miembro) invitado por su admin
    v_org_id := (new.raw_user_meta_data ->> 'organization_id')::uuid;
    v_rol := coalesce((new.raw_user_meta_data ->> 'rol')::public.rol, 'cobrador');

    insert into public.profiles (id, organization_id, nombre_completo, rol)
    values (new.id, v_org_id, v_nombre, v_rol)
    on conflict (id) do nothing;
  else
    -- Prestamista nuevo: crea organización + perfil admin
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
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
