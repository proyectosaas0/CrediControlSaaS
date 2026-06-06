# Backend CRUD Roles Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every backend module work by role (`super_admin`, `admin`, `cobrador`) and create usable `super@credicontrol.test` credentials.

**Architecture:** First repair the Supabase foundation that all CRUD endpoints depend on: RPC signatures, grants, trigram index, JWT hook and RLS. Then verify each HTTP endpoint against a role matrix using real sessions/users, fixing the smallest failing layer: route authorization, query filters, RLS, or RPC. Keep all database changes in a local migration file and verify with Supabase advisors and SQL evidence.

**Tech Stack:** Next.js API routes, Supabase Auth, Postgres RLS, PostgREST RPC, TypeScript generated database types, Vitest when local dependencies are available.

---

## Files

- Create: `supabase/migrations/20260605_backend_roles_hardening.sql`
- Modify: `lib/database.types.ts`
- Modify: `docs/PRODUCTION_READINESS.md`
- Possible modify: `app/api/**/route.ts` only when route behavior is proven wrong
- Possible create: `docs/backend-role-crud-audit.md`

---

### Task 1: Repair Supabase RPC, Grants, and Indexes

**Files:**
- Create: `supabase/migrations/20260605_backend_roles_hardening.sql`
- Verify via MCP SQL queries

- [ ] **Step 1: Confirm current broken state**

Run SQL:

```sql
select n.nspname as schema,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       pg_get_function_result(p.oid) as returns,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('audit_action','register_payment','current_org_id','current_rol','is_super_admin','custom_access_token_hook','handle_new_user')
order by p.proname, args;
```

Expected before fix: extra overloads exist for `audit_action(action text, ...)` and `register_payment(p_prestamo_id uuid, p_monto numeric, ...)`.

- [ ] **Step 2: Write migration SQL**

Create `supabase/migrations/20260605_backend_roles_hardening.sql` with:

```sql
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

revoke execute on function public.audit_action(uuid, uuid, text, text, text, uuid, jsonb, jsonb, inet, text) from public, anon, authenticated;
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
```

- [ ] **Step 3: Apply migration remotely**

Use MCP `apply_migration` with name `backend_roles_hardening` and the exact SQL from Step 2.

- [ ] **Step 4: Verify functions and grants**

Run SQL:

```sql
select n.nspname as schema,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('audit_action','register_payment','custom_access_token_hook','handle_new_user')
order by p.proname, args;

select grantee, routine_name, specific_name
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('audit_action','register_payment','custom_access_token_hook','handle_new_user')
order by routine_name, specific_name, grantee;
```

Expected: only app-used overloads remain; `custom_access_token_hook` and `handle_new_user` are not executable by `PUBLIC`, `anon`, or `authenticated`.

- [ ] **Step 5: Verify trigram index**

Run SQL:

```sql
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname = 'idx_clientes_nombre_trgm';
```

Expected: one GIN trigram index on `clientes.nombre`.

---

### Task 2: Ensure Super Admin Credentials

**Files:**
- No file change unless documenting result

- [ ] **Step 1: Verify existing super admin**

Run SQL:

```sql
select u.id, u.email, p.rol, p.organization_id, p.activo
from auth.users u
join public.profiles p on p.id = u.id
where u.email = 'super@credicontrol.test';
```

Expected: one row with `rol = 'super_admin'`, `organization_id is null`, `activo = true`.

- [ ] **Step 2: Reset password using Supabase Auth Admin**

Use the Supabase Auth Admin API or Dashboard, not manual `auth.users.encrypted_password` SQL.

Set a temporary password in a secure channel, then require rotation after login.

- [ ] **Step 3: Validate login and JWT claims**

Log in as `super@credicontrol.test`, then call `/api/auth/me`.

Expected JSON actor:

```json
{
  "role": "super_admin",
  "organizationId": null
}
```

---

### Task 3: Build Role CRUD Matrix

**Files:**
- Create: `docs/backend-role-crud-audit.md`

- [ ] **Step 1: Create matrix document**

Create `docs/backend-role-crud-audit.md` with these modules:

```md
# Backend Role CRUD Audit

## Roles

- super_admin
- admin
- cobrador

## Modules

| Module | Endpoint | Method | super_admin | admin | cobrador | Expected behavior |
| --- | --- | --- | --- | --- | --- | --- |
| Auth | /api/auth/me | GET | allow | allow | allow | Return actor/profile |
| Clientes | /api/clientes | GET | allow | allow own org | allow own org | List filtered rows |
| Clientes | /api/clientes | POST | allow | allow own org | deny | Create client |
| Clientes | /api/clientes/:id | GET | allow | allow own org | allow own org | Read client |
| Clientes | /api/clientes/:id | PATCH | allow | allow own org | deny | Update client |
| Clientes | /api/clientes/:id | DELETE | allow | allow own org | deny | Soft delete |
| Prestamos | /api/prestamos | GET | allow | allow own org | allow assigned | List loans |
| Prestamos | /api/prestamos | POST | allow | allow own org | deny | Create loan and schedule |
| Pagos | /api/pagos | GET | allow | allow own org | allow assigned | List payments |
| Pagos | /api/pagos | POST | allow | allow own org | allow assigned | Register payment |
| Ruta | /api/ruta/hoy | GET | allow | allow own org | allow assigned | Today's route |
| Caja | /api/caja/resumen | GET | allow | allow own org | allow assigned | Cash summary |
| Reportes | /api/reportes/* | GET | allow | allow own org | deny | Reports |
| Super Admin | /api/super-admin/* | GET/POST/PATCH | allow | deny | deny | Tenant administration |
```

---

### Task 4: Verify Endpoints by Role

**Files:**
- Modify route files only for confirmed failures
- Update: `docs/backend-role-crud-audit.md`

- [ ] **Step 1: Obtain real sessions for roles**

Use credentials for:

```text
super_admin: super@credicontrol.test
admin: admin-a@credicontrol.test
cobrador: cobrador-a1@credicontrol.test
```

- [ ] **Step 2: Test read endpoints**

For each role, call:

```text
GET /api/auth/me
GET /api/clientes
GET /api/prestamos
GET /api/pagos
GET /api/ruta/hoy
GET /api/caja/resumen
GET /api/reportes/resumen
GET /api/super-admin/tenants
```

Record status and body in `docs/backend-role-crud-audit.md`.

- [ ] **Step 3: Test write endpoints with reversible test data**

Use unique names like `QA Cliente 2026-06-05`.

Test:

```text
POST /api/clientes
PATCH /api/clientes/:id
DELETE /api/clientes/:id
POST /api/prestamos
POST /api/pagos
POST /api/caja/cierre-ruta
POST /api/caja/cierre-general
```

Expected: admin/super_admin allowed where designed; cobrador denied except assigned payment/caja route flows.

- [ ] **Step 4: Fix only confirmed failures**

If endpoint fails, identify the layer:

```text
401/403 before query -> requireApiActor or role matrix
empty data unexpectedly -> RLS or organization/cobrador filter
500 on RPC -> RPC signature/body/grants
validation error -> request schema/client payload mismatch
```

Apply the smallest fix and retest that endpoint/role pair.

---

### Task 5: Final Verification

**Files:**
- Modify: `docs/PRODUCTION_READINESS.md`
- Modify: `lib/database.types.ts`

- [ ] **Step 1: Run advisors**

Run Supabase security and performance advisors.

Expected: no unresolved critical items from this hardening work.

- [ ] **Step 2: Regenerate TypeScript types**

Run Supabase type generation and replace `lib/database.types.ts` with generated content.

Expected: file is non-empty and includes only intended RPC signatures.

- [ ] **Step 3: Update production readiness**

Change `docs/PRODUCTION_READINESS.md` from blocked to ready only after endpoint matrix is complete and advisors are acceptable.

- [ ] **Step 4: Report evidence**

Final report must include:

```text
- Migration applied
- Functions/grants SQL result summary
- Trigram index SQL result summary
- Users/roles verified
- CRUD matrix result by role
- Advisors result
```

---

## Self-Review

- Spec coverage: covers DB repair, credentials, CRUD by role, verification, and docs.
- Placeholder scan: no TODO/TBD placeholders remain.
- Type consistency: function names and endpoint paths match current code inventory.
