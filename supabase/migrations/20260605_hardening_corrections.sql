-- ============================================================================
-- PRODUCTION SECURITY HARDENING - CORRECTIONS
-- ============================================================================
-- Issues found:
-- 1. audit_action overload (5-arg) exposed to anon/authenticated
-- 2. register_payment overload (12-arg) exposed to anon/authenticated
-- 3. audit_logs_select_admin policy grants to 'public' role
-- 4. audit_action overload (10-arg) missing SECURITY DEFINER
-- 5. register_payment overload (12-arg) missing SECURITY DEFINER
-- ============================================================================

-- ============================================================================
-- PROBLEM 1-2, 4-5: FIX FUNCTION OVERLOADS AND PERMISSIONS
-- ============================================================================

-- Audit Action: Keep only the SECURITY DEFINER version (5-arg)
-- Drop the plain version (10-arg) that app should NOT call directly
drop function if exists public.audit_action(
  p_organization_id uuid, 
  p_actor_id uuid, 
  p_actor_rol text, 
  p_accion text, 
  p_entidad text, 
  p_entidad_id uuid,
  p_estado_anterior jsonb,
  p_estado_nuevo jsonb,
  p_ip inet,
  p_user_agent text
);

-- Ensure the SECURITY DEFINER version has correct permissions
revoke execute on function public.audit_action(text, text, uuid, jsonb, jsonb) from anon, authenticated, public;
grant execute on function public.audit_action(text, text, uuid, jsonb, jsonb) to authenticated, service_role;

-- Register Payment: Keep only the SECURITY DEFINER version (4-arg)
-- Drop the plain version (12-arg) that lacks SECURITY DEFINER
drop function if exists public.register_payment(
  p_organization_id uuid,
  p_prestamo_id uuid,
  p_cronograma_pago_id uuid,
  p_cliente_id uuid,
  p_cobrador_id uuid,
  p_registrado_por uuid,
  p_monto numeric,
  p_medio_pago text,
  p_tipo text,
  p_lat numeric,
  p_lng numeric,
  p_nota text
);

-- Ensure the SECURITY DEFINER version has correct permissions
revoke execute on function public.register_payment(uuid, numeric, text, text) from anon, authenticated, public;
grant execute on function public.register_payment(uuid, numeric, text, text) to authenticated, service_role;

-- ============================================================================
-- PROBLEM 3: FIX audit_logs RLS POLICIES
-- ============================================================================

-- Remove the problematic 'public' role policy
drop policy if exists "audit_logs_select_admin" on public.audit_logs;

-- Recreate with proper roles: only authenticated users who are admin/super_admin
create policy "audit_logs_select_admin" on public.audit_logs
  for select
  to authenticated
  using (
    (
      select rol from public.profiles where id = auth.uid()
    ) = any(array['admin'::text, 'super_admin'::text])
    or actor_id = auth.uid()
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify no issues remain:

-- Check function signatures exist and are correct
-- select proname, pg_get_function_identity_arguments(oid) 
-- from pg_proc 
-- where pronamespace = (select oid from pg_namespace where nspname='public') 
--   and proname in ('audit_action', 'register_payment');

-- Check permissions
-- select p.proname, p.proacl 
-- from pg_proc p 
-- join pg_namespace n on n.oid = p.pronamespace 
-- where n.nspname='public' and p.proname in ('audit_action', 'register_payment');

-- Check RLS policies
-- select * from pg_policies where tablename = 'audit_logs';

-- ============================================================================
-- NOTES
-- ============================================================================
-- ✓ pg_trgm: Exists and is correctly in 'extensions' schema
-- ✓ Indices: All foreign keys have indices (no trigram needed)
-- ✓ Custom Access Token Hook: Has SET search_path and correct grants
-- ✓ Other functions: All have SET search_path and SECURITY DEFINER
-- ✓ RLS: Enabled on all 16 public tables

comment on function public.audit_action(text, text, uuid, jsonb, jsonb) is 
  'Internal audit logging. SECURITY DEFINER. Only callable by authenticated users and service_role.';

comment on function public.register_payment(uuid, numeric, text, text) is
  'Register payment with auto-generated audit trail. SECURITY DEFINER. Only callable by authenticated users and service_role.';
