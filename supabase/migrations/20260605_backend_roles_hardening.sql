-- Backend role and CRUD hardening.

drop function if exists public.audit_action(text, text, uuid, jsonb, jsonb);
drop function if exists public.register_payment(uuid, numeric, text, text);

create extension if not exists pg_trgm with schema extensions;

create index if not exists idx_clientes_nombre_trgm
  on public.clientes using gin (nombre extensions.gin_trgm_ops);

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

revoke execute on function public.audit_action(uuid, uuid, text, text, text, uuid, jsonb, jsonb, inet, text) from public, anon;
grant execute on function public.audit_action(uuid, uuid, text, text, text, uuid, jsonb, jsonb, inet, text) to authenticated, service_role;

revoke execute on function public.register_payment(uuid, uuid, uuid, uuid, uuid, uuid, numeric, medio_pago, text, numeric, numeric, text) from public, anon;
grant execute on function public.register_payment(uuid, uuid, uuid, uuid, uuid, uuid, numeric, medio_pago, text, numeric, numeric, text) to authenticated, service_role;

revoke execute on function public.current_org_id() from public, anon;
revoke execute on function public.current_rol() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.current_org_id() to authenticated, service_role;
grant execute on function public.current_rol() to authenticated, service_role;
grant execute on function public.is_super_admin() to authenticated, service_role;

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_insert_authenticated on public.audit_logs;
drop policy if exists audit_logs_select_own_org on public.audit_logs;

create policy audit_logs_insert_authenticated on public.audit_logs
  for insert to authenticated
  with check (actor_id = (select auth.uid()));

create policy audit_logs_select_own_org on public.audit_logs
  for select to authenticated
  using (
    public.is_super_admin()
    or organization_id = public.current_org_id()
  );
