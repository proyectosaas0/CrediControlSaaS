# Fundación (Backend) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la capa de backend multi-tenant de CrédiControl en Supabase + Next 16: 7 tablas con RLS por claims de JWT, roles, trigger de registro, helpers de cliente, tipos generados, seed y pruebas de aislamiento. Sin UI.

**Architecture:** Postgres en Supabase con Row Level Security en todas las tablas. El aislamiento se resuelve leyendo `organization_id` y `rol` desde claims inyectados en el JWT por un Custom Access Token Hook (Opción A del diseño), por lo que las políticas no consultan tablas (rápido, sin recursión). Next 16 consume Supabase vía `@supabase/ssr`. Toda la lógica de negocio queda fuera de alcance.

**Tech Stack:** Supabase (Postgres + Auth), Supabase CLI, Next.js 16.2.7, React 19, TypeScript, `@supabase/ssr`, `@supabase/supabase-js`, Vitest, tsx, dotenv.

**Documento de diseño:** `docs/superpowers/specs/2026-06-04-fundacion-backend-design.md`

**Desviaciones del spec (decididas al planificar):**
- Funciones auxiliares en esquema `public` (`current_org_id()`, `current_rol()`, `is_super_admin()`), no en `auth` — el esquema `auth` de Supabase hospedado es restringido.
- Numeración de migraciones: `0001` esquema → `0002` helpers → `0003` RLS → `0004` hook → `0005` trigger (las políticas necesitan los helpers ya creados).
- Habilitar el auth hook es configuración (Dashboard / `config.toml`), no SQL — Task 6 es un checkpoint manual.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `supabase/config.toml` | Config del proyecto local + habilitación del auth hook |
| `supabase/migrations/0001_schema.sql` | Extensiones, enums, 7 tablas, índices, FKs |
| `supabase/migrations/0002_helpers.sql` | `current_org_id()`, `current_rol()`, `is_super_admin()` |
| `supabase/migrations/0003_rls.sql` | `enable`/`force` RLS + políticas por tabla |
| `supabase/migrations/0004_auth_hook.sql` | `custom_access_token_hook` + grants |
| `supabase/migrations/0005_signup_trigger.sql` | `handle_new_user` + trigger |
| `lib/supabase/client.ts` | Cliente Supabase de navegador |
| `lib/supabase/server.ts` | Cliente Supabase de servidor (cookies) |
| `lib/supabase/middleware.ts` | Refresco de sesión en middleware |
| `lib/auth.ts` | `getUser()`, `getRole()`, `getOrgId()`, `requireRole()` |
| `lib/database.types.ts` | Tipos generados desde el esquema |
| `middleware.ts` | Middleware raíz: protección de rutas + refresco |
| `scripts/seed.ts` | Datos de prueba (service role + Auth Admin API) |
| `tests/rls-isolation.test.ts` | Pruebas de aislamiento multi-tenant |
| `tests/helpers.ts` | Utilidades de test (clientes por usuario) |
| `vitest.config.ts` | Config de Vitest |
| `.env.example` | Plantilla de variables de entorno |

---

## Task 1: Dependencias y andamiaje del proyecto

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `supabase/config.toml` (vía `supabase init`)

- [ ] **Step 1: Instalar dependencias**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest tsx dotenv
```
Expected: instala sin errores; aparecen en `package.json`.

- [ ] **Step 2: Inicializar Supabase CLI (crea la carpeta `supabase/`)**

Run: `npx supabase init`
Expected: crea `supabase/config.toml` y `supabase/.gitignore`. Si pregunta por VS Code settings, responde `N`.

- [ ] **Step 3: Añadir scripts a `package.json`**

En la sección `"scripts"` añade:
```json
"db:push": "supabase db push",
"db:reset": "supabase db reset",
"gen:types": "supabase gen types typescript --linked > lib/database.types.ts",
"seed": "tsx scripts/seed.ts",
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Crear `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: { ...process.env },
    setupFiles: ["dotenv/config"],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});
```

- [ ] **Step 5: Crear `.env.example`**

```bash
# Supabase — proyecto aamfmqhhmuwnyqdsqklr
NEXT_PUBLIC_SUPABASE_URL=https://aamfmqhhmuwnyqdsqklr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=__publishable_or_anon_key__
# Solo backend / seed / tests — NUNCA exponer al cliente
SUPABASE_SERVICE_ROLE_KEY=__service_role_key__
```

- [ ] **Step 6: Crear `.env` real (no se commitea)**

Copia `.env.example` a `.env` y rellena las claves reales desde el Dashboard de Supabase
(Project Settings → API). Un único archivo `.env` lo leen los tres consumidores: Next
(server-side), `dotenv/config` (seed) y Vitest (`setupFiles`). `.gitignore` ya excluye
`.env*`, así que no se commitea.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts .env.example supabase/config.toml supabase/.gitignore
git commit -m "chore: andamiaje backend (supabase-js, ssr, vitest, supabase CLI)"
```

---

## Task 2: Migración 0001 — esquema (enums, tablas, índices)

**Files:**
- Create: `supabase/migrations/0001_schema.sql`

- [ ] **Step 1: Escribir `supabase/migrations/0001_schema.sql`**

```sql
-- Extensiones
create extension if not exists pg_trgm;

-- Enums
create type rol as enum ('super_admin', 'admin', 'cobrador');
create type estado_suscripcion as enum ('activo', 'trial', 'vencido', 'suspendido');
create type modelo_interes as enum ('cuota_fija', 'solo_interes', 'sobre_saldo');
create type estado_prestamo as enum ('activo', 'en_mora', 'saldado', 'refinanciado', 'cancelado');
create type estado_cuota as enum ('pendiente', 'pagado', 'parcial', 'vencido');
create type medio_pago as enum ('efectivo', 'nequi', 'transferencia');
create type estado_mora as enum ('activa', 'pagada', 'condonada');

-- organizations (tenants)
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  nombre_negocio text not null,
  logo_url text,
  ciudad text,
  telefono text,
  plan text,
  estado_suscripcion estado_suscripcion not null default 'trial',
  trial_hasta date,
  created_at timestamptz not null default now()
);

-- profiles (usuarios; organization_id nullable solo para super_admin)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete restrict,
  nombre_completo text not null default '',
  rol rol not null,
  telefono text,
  activo boolean not null default true,
  ultimo_acceso timestamptz
);

-- clientes
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  nombre text not null,
  cedula text,
  telefono text,
  direccion text,
  barrio text,
  notas text,
  score_pago numeric not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- prestamos
create table public.prestamos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  cobrador_id uuid references public.profiles(id) on delete set null,
  capital numeric(14,2) not null,
  modelo_interes modelo_interes not null,
  tasa_mensual numeric not null,
  total_pagar numeric(14,2),
  cuota_diaria numeric(14,2),
  plazo_dias integer not null,
  dias_habiles integer,
  excluir_sabados boolean not null default false,
  excluir_domingos boolean not null default false,
  fecha_inicio date,
  fecha_fin date,
  estado estado_prestamo not null default 'activo',
  prestamo_anterior_id uuid references public.prestamos(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- cronograma_pagos
create table public.cronograma_pagos (
  id uuid primary key default gen_random_uuid(),
  prestamo_id uuid not null references public.prestamos(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  numero_cuota integer not null,
  fecha_esperada date not null,
  monto_esperado numeric(14,2) not null,
  estado estado_cuota not null default 'pendiente',
  fecha_pago timestamptz,
  monto_pagado numeric(14,2) not null default 0,
  medio_pago medio_pago,
  cobrador_id uuid references public.profiles(id) on delete set null,
  lat numeric,
  lng numeric
);

-- mora_registros
create table public.mora_registros (
  id uuid primary key default gen_random_uuid(),
  prestamo_id uuid not null references public.prestamos(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  fecha_inicio_mora date,
  dias_mora integer,
  monto_mora numeric(14,2),
  monto_pagado_mora numeric(14,2) not null default 0,
  estado estado_mora not null default 'activa'
);

-- cierres_caja
create table public.cierres_caja (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  cobrador_id uuid references public.profiles(id) on delete set null,
  fecha date not null,
  total_esperado numeric(14,2),
  total_recaudado numeric(14,2),
  efectivo_declarado numeric(14,2),
  cerrado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Índices de aislamiento (organization_id en cada tabla)
create index idx_profiles_org on public.profiles (organization_id);
create index idx_clientes_org on public.clientes (organization_id);
create index idx_prestamos_org on public.prestamos (organization_id);
create index idx_cronograma_org on public.cronograma_pagos (organization_id);
create index idx_mora_org on public.mora_registros (organization_id);
create index idx_cierres_org on public.cierres_caja (organization_id);

-- Índices compuestos para consultas calientes
create index idx_cronograma_ruta on public.cronograma_pagos (organization_id, fecha_esperada, estado);
create index idx_cronograma_prestamo on public.cronograma_pagos (prestamo_id);
create index idx_prestamos_cobrador on public.prestamos (organization_id, cobrador_id, estado);
create index idx_prestamos_estado on public.prestamos (organization_id, estado);
create index idx_prestamos_cliente on public.prestamos (cliente_id);
create index idx_mora_estado on public.mora_registros (organization_id, estado);
create index idx_cierres_fecha on public.cierres_caja (organization_id, fecha);
create index idx_cierres_cobrador on public.cierres_caja (cobrador_id, fecha);
create index idx_profiles_rol on public.profiles (organization_id, rol);
create index idx_clientes_cedula on public.clientes (organization_id, cedula);

-- Búsqueda por nombre (trigram)
create index idx_clientes_nombre_trgm on public.clientes using gin (nombre gin_trgm_ops);
```

- [ ] **Step 2: Vincular el proyecto remoto**

Run: `npx supabase link --project-ref aamfmqhhmuwnyqdsqklr`
Expected: pide el access token / password de la BD; queda vinculado. (Alternativa sin CLI: aplicar el SQL vía el MCP `apply_migration` una vez autenticado.)

- [ ] **Step 3: Aplicar la migración al remoto**

Run: `npm run db:push`
Expected: aplica `0001_schema.sql` sin errores.

- [ ] **Step 4: Verificar tablas y enums**

Run:
```bash
npx supabase db push --dry-run
```
y/o consulta vía Dashboard SQL editor:
```sql
select table_name from information_schema.tables
where table_schema = 'public' order by table_name;
```
Expected: aparecen las 7 tablas (`organizations, profiles, clientes, prestamos, cronograma_pagos, mora_registros, cierres_caja`).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_schema.sql
git commit -m "feat(db): esquema base — 7 tablas, enums, índices, pg_trgm"
```

---

## Task 3: Migración 0002 — funciones auxiliares

**Files:**
- Create: `supabase/migrations/0002_helpers.sql`

- [ ] **Step 1: Escribir `supabase/migrations/0002_helpers.sql`**

```sql
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
```

- [ ] **Step 2: Aplicar**

Run: `npm run db:push`
Expected: aplica sin errores.

- [ ] **Step 3: Verificar que existen**

En el SQL editor:
```sql
select proname from pg_proc
where proname in ('current_org_id', 'current_rol', 'is_super_admin');
```
Expected: 3 filas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_helpers.sql
git commit -m "feat(db): helpers RLS que leen claims del JWT"
```

---

## Task 4: Migración 0003 — RLS y políticas

**Files:**
- Create: `supabase/migrations/0003_rls.sql`

- [ ] **Step 1: Escribir `supabase/migrations/0003_rls.sql`**

```sql
-- Activar y forzar RLS en todas las tablas
alter table public.organizations    enable row level security;
alter table public.organizations    force row level security;
alter table public.profiles          enable row level security;
alter table public.profiles          force row level security;
alter table public.clientes          enable row level security;
alter table public.clientes          force row level security;
alter table public.prestamos         enable row level security;
alter table public.prestamos         force row level security;
alter table public.cronograma_pagos  enable row level security;
alter table public.cronograma_pagos  force row level security;
alter table public.mora_registros    enable row level security;
alter table public.mora_registros    force row level security;
alter table public.cierres_caja      enable row level security;
alter table public.cierres_caja      force row level security;

-- ============ organizations ============
create policy organizations_select on public.organizations
  for select to authenticated
  using (id = public.current_org_id() or public.is_super_admin());

create policy organizations_update on public.organizations
  for update to authenticated
  using ((id = public.current_org_id() and public.current_rol() = 'admin') or public.is_super_admin())
  with check ((id = public.current_org_id() and public.current_rol() = 'admin') or public.is_super_admin());

create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (public.is_super_admin());

create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.is_super_admin());

-- ============ profiles ============
create policy profiles_select on public.profiles
  for select to authenticated
  using (organization_id = public.current_org_id() or id = auth.uid() or public.is_super_admin());

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

create policy profiles_update on public.profiles
  for update to authenticated
  using (public.is_super_admin()
         or id = auth.uid()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin()
              or id = auth.uid()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

create policy profiles_delete on public.profiles
  for delete to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

-- ============ clientes ============
create policy clientes_select on public.clientes
  for select to authenticated
  using (public.is_super_admin() or organization_id = public.current_org_id());

create policy clientes_write on public.clientes
  for all to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

-- ============ prestamos ============
create policy prestamos_select on public.prestamos
  for select to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id()
             and (public.current_rol() = 'admin'
                  or (public.current_rol() = 'cobrador' and cobrador_id = auth.uid()))));

create policy prestamos_write on public.prestamos
  for all to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

-- ============ cronograma_pagos ============
create policy cronograma_select on public.cronograma_pagos
  for select to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id()
             and (public.current_rol() = 'admin'
                  or (public.current_rol() = 'cobrador' and cobrador_id = auth.uid()))));

-- El cobrador puede ACTUALIZAR (registrar pago) solo sus cuotas
create policy cronograma_update on public.cronograma_pagos
  for update to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id()
             and (public.current_rol() = 'admin'
                  or (public.current_rol() = 'cobrador' and cobrador_id = auth.uid()))))
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id()
                  and (public.current_rol() = 'admin'
                       or (public.current_rol() = 'cobrador' and cobrador_id = auth.uid()))));

-- Crear/borrar cuotas: solo admin (se generan al crear el préstamo)
create policy cronograma_insert on public.cronograma_pagos
  for insert to authenticated
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

create policy cronograma_delete on public.cronograma_pagos
  for delete to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

-- ============ mora_registros ============
create policy mora_select on public.mora_registros
  for select to authenticated
  using (public.is_super_admin() or organization_id = public.current_org_id());

create policy mora_write on public.mora_registros
  for all to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

-- ============ cierres_caja ============
create policy cierres_select on public.cierres_caja
  for select to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id()
             and (public.current_rol() = 'admin'
                  or (public.current_rol() = 'cobrador' and cobrador_id = auth.uid()))));

-- Cobrador puede crear su cierre de ruta; admin todo
create policy cierres_insert on public.cierres_caja
  for insert to authenticated
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id()
                  and public.current_rol() in ('admin', 'cobrador')));

create policy cierres_modify on public.cierres_caja
  for update to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin()
              or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

create policy cierres_delete on public.cierres_caja
  for delete to authenticated
  using (public.is_super_admin()
         or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));
```

- [ ] **Step 2: Aplicar**

Run: `npm run db:push`
Expected: aplica sin errores.

- [ ] **Step 3: Verificar RLS activo**

```sql
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname in ('organizations','profiles','clientes','prestamos','cronograma_pagos','mora_registros','cierres_caja');
```
Expected: `relrowsecurity` y `relforcerowsecurity` en `true` para las 7.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_rls.sql
git commit -m "feat(db): RLS forzado y políticas por rol en las 7 tablas"
```

---

## Task 5: Migración 0004 — Custom Access Token Hook

**Files:**
- Create: `supabase/migrations/0004_auth_hook.sql`

- [ ] **Step 1: Escribir `supabase/migrations/0004_auth_hook.sql`**

```sql
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
```

- [ ] **Step 2: Aplicar**

Run: `npm run db:push`
Expected: aplica sin errores.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0004_auth_hook.sql
git commit -m "feat(db): custom access token hook + grants para supabase_auth_admin"
```

---

## Task 6: Habilitar el auth hook (CHECKPOINT MANUAL)

> El hook se **define** por SQL (Task 5) pero se **activa** por configuración. Hasta que esto se haga, los JWT NO llevan los claims y RLS denegará todo (fail-closed). Es un paso obligatorio.

**Files:**
- Modify: `supabase/config.toml`

- [ ] **Step 1: Habilitar vía Dashboard (camino recomendado para remoto)**

En el Dashboard de Supabase → **Authentication → Hooks (Beta)** → **Custom Access Token**:
- Habilitar.
- Apuntar a: `public.custom_access_token_hook`.
- Guardar.

- [ ] **Step 2: Reflejarlo también en `supabase/config.toml` (para entornos locales)**

Añadir:
```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

- [ ] **Step 3: Verificar manualmente que los claims aparecen**

Tras tener el seed (Task 8), iniciar sesión como un usuario y decodificar el `access_token` (p.ej. en jwt.io). Expected: el payload incluye `"rol"` y `"organization_id"`.

- [ ] **Step 4: Commit**

```bash
git add supabase/config.toml
git commit -m "chore: habilitar custom access token hook en config"
```

---

## Task 7: Migración 0005 — trigger de registro

**Files:**
- Create: `supabase/migrations/0005_signup_trigger.sql`

- [ ] **Step 1: Escribir `supabase/migrations/0005_signup_trigger.sql`**

```sql
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
```

- [ ] **Step 2: Aplicar**

Run: `npm run db:push`
Expected: aplica sin errores.

- [ ] **Step 3: Verificar el trigger**

```sql
select tgname from pg_trigger where tgname = 'on_auth_user_created';
```
Expected: 1 fila.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0005_signup_trigger.sql
git commit -m "feat(db): trigger handle_new_user (org+admin o cobrador invitado)"
```

---

## Task 8: Generar tipos TypeScript

**Files:**
- Create: `lib/database.types.ts`

- [ ] **Step 1: Generar tipos desde el esquema remoto**

Run: `npm run gen:types`
Expected: crea `lib/database.types.ts` con el tipo `Database` y los enums como uniones.

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/database.types.ts
git commit -m "feat(types): tipos TS generados del esquema Supabase"
```

---

## Task 9: Clientes Supabase y helpers de auth (Next 16)

> **Antes de escribir:** lee `node_modules/@supabase/ssr/README.md` y la guía de Next en `node_modules/next/dist/docs/` para confirmar la API exacta de `cookies()` y middleware en Next 16.2.7 (el `AGENTS.md` advierte cambios de API). Ajusta las firmas si difieren de lo de abajo.

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `lib/auth.ts`
- Create: `middleware.ts`

- [ ] **Step 1: `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: `lib/supabase/server.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component — ignorable si hay middleware refrescando.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: `lib/supabase/middleware.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresca la sesión (no quitar).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
```

- [ ] **Step 4: `middleware.ts` (raíz)**

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Prefijos que NO requieren sesión. Ajustar al conectar la UI.
const PUBLIC_PREFIXES = ["/login", "/signup", "/auth", "/_next", "/favicon.ico"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 5: `lib/auth.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type AppRole = "super_admin" | "admin" | "cobrador";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function claim<T = string>(user: User | null, key: string): T | null {
  // Los claims viven en el access token; supabase-js los expone en app_metadata
  // tras decodificar, pero la fuente fiable es el JWT. Para server-side leemos
  // del user (app_metadata) que refleja los claims personalizados.
  const value = (user?.app_metadata as Record<string, unknown> | undefined)?.[key];
  return (value ?? null) as T | null;
}

export async function getRole(): Promise<AppRole | null> {
  const user = await getUser();
  return claim<AppRole>(user, "rol");
}

export async function getOrgId(): Promise<string | null> {
  const user = await getUser();
  return claim<string>(user, "organization_id");
}

export async function requireRole(...roles: AppRole[]): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const rol = claim<AppRole>(user, "rol");
  if (!rol || !roles.includes(rol)) throw new Error("Rol no autorizado");
  return user;
}
```

> Nota de implementación: si `app_metadata` no refleja los claims personalizados en este SDK/version, decodifica el `access_token` (`supabase.auth.getSession()` → `session.access_token`) con `jwtDecode`. Confirma cuál funciona en el Step 7 y deja solo esa vía.

- [ ] **Step 6: Verificar compilación**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 7: Verificar arranque del dev server**

Run: `npm run dev` y abre `http://localhost:3000`.
Expected: sin errores de runtime del middleware en consola (redirige a `/login`, que aún no existe → 404 esperado, pero sin crash del middleware).

- [ ] **Step 8: Commit**

```bash
git add lib/supabase/ lib/auth.ts middleware.ts
git commit -m "feat(auth): clientes @supabase/ssr, middleware y helpers de rol"
```

---

## Task 10: Script de seed

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Escribir `scripts/seed.ts`**

```typescript
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createUser(
  email: string,
  password: string,
  meta: Record<string, unknown>,
): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user!.id;
}

async function main() {
  // 1) Super admin: sin organization_id (no pasa metadata de org → el trigger
  //    intentaría crear org. Para super_admin lo creamos SIN disparar el flujo
  //    normal: pasamos un flag y ajustamos el perfil después.)
  const superId = await createUser("super@credicontrol.test", "Password123!", {
    nombre_completo: "Super Admin",
    nombre_negocio: "__superadmin__",
  });
  // Reasignar a super_admin global
  await admin.from("profiles").update({ rol: "super_admin", organization_id: null }).eq("id", superId);
  // Borrar la org placeholder creada por el trigger
  await admin.from("organizations").delete().eq("nombre_negocio", "__superadmin__");

  // 2) Org A — admin + 2 cobradores
  const adminAId = await createUser("admin-a@credicontrol.test", "Password123!", {
    nombre_completo: "Admin A",
    nombre_negocio: "Préstamos La Esperanza",
    ciudad: "Valledupar",
    telefono: "3000000001",
  });
  const { data: profA } = await admin.from("profiles").select("organization_id").eq("id", adminAId).single();
  const orgA = profA!.organization_id!;

  const cobA1 = await createUser("cobrador-a1@credicontrol.test", "Password123!", {
    nombre_completo: "Cobrador A1",
    organization_id: orgA,
    rol: "cobrador",
  });
  const cobA2 = await createUser("cobrador-a2@credicontrol.test", "Password123!", {
    nombre_completo: "Cobrador A2",
    organization_id: orgA,
    rol: "cobrador",
  });

  // 3) Org B — admin + 1 cobrador
  const adminBId = await createUser("admin-b@credicontrol.test", "Password123!", {
    nombre_completo: "Admin B",
    nombre_negocio: "Crédito Rápido B",
    ciudad: "Bogotá",
    telefono: "3000000002",
  });
  const { data: profB } = await admin.from("profiles").select("organization_id").eq("id", adminBId).single();
  const orgB = profB!.organization_id!;

  const cobB1 = await createUser("cobrador-b1@credicontrol.test", "Password123!", {
    nombre_completo: "Cobrador B1",
    organization_id: orgB,
    rol: "cobrador",
  });

  // 4) Clientes + préstamos + cronograma (vía service role, bypassa RLS)
  const { data: cliA } = await admin
    .from("clientes")
    .insert([
      { organization_id: orgA, nombre: "Cliente A-Uno", cedula: "111", telefono: "3101111111" },
      { organization_id: orgA, nombre: "Cliente A-Dos", cedula: "112", telefono: "3101111112" },
      { organization_id: orgA, nombre: "Cliente A-Tres", cedula: "113", telefono: "3101111113" },
    ])
    .select();

  const { data: cliB } = await admin
    .from("clientes")
    .insert([
      { organization_id: orgB, nombre: "Cliente B-Uno", cedula: "211", telefono: "3202222221" },
      { organization_id: orgB, nombre: "Cliente B-Dos", cedula: "212", telefono: "3202222222" },
    ])
    .select();

  // Préstamo de A asignado a cobrador A1
  const { data: presA } = await admin
    .from("prestamos")
    .insert([
      {
        organization_id: orgA,
        cliente_id: cliA![0].id,
        cobrador_id: cobA1,
        capital: 1000000,
        modelo_interes: "cuota_fija",
        tasa_mensual: 20,
        total_pagar: 1200000,
        cuota_diaria: 60000,
        plazo_dias: 20,
        created_by: adminAId,
      },
      {
        organization_id: orgA,
        cliente_id: cliA![1].id,
        cobrador_id: cobA2,
        capital: 500000,
        modelo_interes: "cuota_fija",
        tasa_mensual: 20,
        total_pagar: 600000,
        cuota_diaria: 60000,
        plazo_dias: 10,
        created_by: adminAId,
      },
    ])
    .select();

  // Préstamo de B asignado a cobrador B1
  const { data: presB } = await admin
    .from("prestamos")
    .insert([
      {
        organization_id: orgB,
        cliente_id: cliB![0].id,
        cobrador_id: cobB1,
        capital: 800000,
        modelo_interes: "cuota_fija",
        tasa_mensual: 15,
        total_pagar: 920000,
        cuota_diaria: 46000,
        plazo_dias: 20,
        created_by: adminBId,
      },
    ])
    .select();

  // Una cuota de cronograma por préstamo (suficiente para los tests)
  await admin.from("cronograma_pagos").insert([
    { prestamo_id: presA![0].id, organization_id: orgA, numero_cuota: 1, fecha_esperada: "2026-06-05", monto_esperado: 60000, cobrador_id: cobA1 },
    { prestamo_id: presA![1].id, organization_id: orgA, numero_cuota: 1, fecha_esperada: "2026-06-05", monto_esperado: 60000, cobrador_id: cobA2 },
    { prestamo_id: presB![0].id, organization_id: orgB, numero_cuota: 1, fecha_esperada: "2026-06-05", monto_esperado: 46000, cobrador_id: cobB1 },
  ]);

  console.log("Seed completo:", { orgA, orgB, superId, adminAId, adminBId, cobA1, cobA2, cobB1 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Ejecutar el seed**

Run: `npm run seed`
Expected: imprime "Seed completo" con los IDs. (Idempotencia: si los usuarios ya existen, `createUser` falla por email duplicado — para re-sembrar, usa `npm run db:reset` o borra los usuarios de prueba primero.)

- [ ] **Step 3: Verificar datos**

```sql
select nombre_negocio, estado_suscripcion, trial_hasta from public.organizations;
select nombre_completo, rol, organization_id from public.profiles order by rol;
```
Expected: 2 orgs en `trial` con `trial_hasta` ≈ hoy+15d; 1 super_admin (org null), 2 admins, 3 cobradores.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat(seed): 2 tenants de prueba + super_admin vía Auth Admin API"
```

---

## Task 11: Pruebas de aislamiento RLS

**Files:**
- Create: `tests/helpers.ts`
- Create: `tests/rls-isolation.test.ts`

- [ ] **Step 1: Escribir `tests/helpers.ts`**

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function serviceClient(): SupabaseClient<Database> {
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function clientAs(email: string): Promise<SupabaseClient<Database>> {
  const supabase = anonClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: "Password123!" });
  if (error) throw new Error(`signIn ${email}: ${error.message}`);
  return supabase;
}
```

- [ ] **Step 2: Escribir `tests/rls-isolation.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { clientAs, anonClient, serviceClient } from "./helpers";

describe("Aislamiento multi-tenant (RLS)", () => {
  it("admin de A no ve préstamos de B", async () => {
    const a = await clientAs("admin-a@credicontrol.test");
    const { data } = await a.from("prestamos").select("organization_id");
    expect(data).toBeTruthy();
    expect(data!.length).toBeGreaterThan(0);
    // Todas las filas visibles son de la org de A; ninguna de B.
    const orgs = new Set(data!.map((r) => r.organization_id));
    expect(orgs.size).toBe(1);
  });

  it("admin de A ve 0 clientes de la cédula de B", async () => {
    const a = await clientAs("admin-a@credicontrol.test");
    const { data } = await a.from("clientes").select("id").eq("cedula", "211"); // cédula de B
    expect(data).toEqual([]);
  });

  it("cobrador A1 solo ve préstamos asignados a él (no los de A2)", async () => {
    // id de A1 vía service role
    const svc = serviceClient();
    const { data: a1 } = await svc
      .from("profiles")
      .select("id")
      .eq("nombre_completo", "Cobrador A1")
      .single();

    const c = await clientAs("cobrador-a1@credicontrol.test");
    const { data } = await c.from("prestamos").select("id, cobrador_id");
    expect(data).toBeTruthy();
    expect(data!.length).toBeGreaterThan(0);
    // Toda fila visible está asignada a A1; ninguna de A2.
    for (const row of data!) {
      expect(row.cobrador_id).toBe(a1!.id);
    }
  });

  it("cobrador A1 NO puede insertar un préstamo (solo admin)", async () => {
    const c = await clientAs("cobrador-a1@credicontrol.test");
    const svc = serviceClient();
    const { data: anyCliente } = await svc.from("clientes").select("id, organization_id").limit(1).single();
    const { error } = await c.from("prestamos").insert({
      organization_id: anyCliente!.organization_id,
      cliente_id: anyCliente!.id,
      capital: 100000,
      modelo_interes: "cuota_fija",
      tasa_mensual: 20,
      plazo_dias: 10,
    });
    expect(error).toBeTruthy(); // RLS rechaza el insert
  });

  it("super_admin ve datos de A y de B", async () => {
    const s = await clientAs("super@credicontrol.test");
    const { data } = await s.from("prestamos").select("organization_id");
    expect(data).toBeTruthy();
    const orgs = new Set(data!.map((r) => r.organization_id));
    expect(orgs.size).toBeGreaterThanOrEqual(2); // ve ambas orgs
  });

  it("cliente sin autenticación no obtiene filas", async () => {
    const anon = anonClient();
    const { data } = await anon.from("prestamos").select("id");
    expect(data ?? []).toEqual([]);
  });
});
```

- [ ] **Step 3: Ejecutar las pruebas (deben PASAR)**

Run: `npm test`
Expected: los 6 tests pasan. Si alguno falla por claims ausentes, revisar que el Task 6 (habilitar el hook) esté hecho — sin el hook, `current_org_id()` devuelve null y todo queda denegado.

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "test(rls): pruebas de aislamiento multi-tenant y restricción por rol"
```

---

## Task 12: Documentación de verificación final

**Files:**
- Create: `supabase/README.md`

- [ ] **Step 1: Escribir `supabase/README.md`**

Documenta: cómo aplicar migraciones (`npm run db:push`), cómo regenerar tipos (`npm run gen:types`), cómo sembrar (`npm run seed`), cómo correr las pruebas (`npm test`), el recordatorio de habilitar el auth hook (Task 6), y la lista de usuarios de prueba con sus credenciales.

- [ ] **Step 2: Verificación integral (criterios de aceptación del spec §8)**

Recorre y marca:
- [ ] Las 5 migraciones aplican limpias.
- [ ] Existen las 7 tablas con enums, índices, FKs y RLS forzado.
- [ ] El auth hook está habilitado y los JWT llevan `rol` + `organization_id`.
- [ ] El trigger crea org+admin para prestamista; solo profile para cobrador invitado.
- [ ] El seed crea super_admin + Org A + Org B.
- [ ] Helpers `lib/supabase/*` y `lib/auth.ts` compilan y el dev server arranca.
- [ ] `lib/database.types.ts` generado.
- [ ] `npm test` pasa al 100%.

- [ ] **Step 3: Commit**

```bash
git add supabase/README.md
git commit -m "docs: guía de operación del backend de la Fundación"
```

---

## Notas de cierre

- **Dependencia crítica:** Task 6 (habilitar el hook) es manual y bloquea las pruebas. No saltarlo.
- **Sin MCP autenticado:** las migraciones se aplican vía Supabase CLI (`db:push`). Si prefieres MCP, sustituye `npm run db:push` por `apply_migration` por cada archivo, en orden.
- **Idempotencia del seed:** re-sembrar requiere limpiar usuarios de prueba o `db:reset` (entornos no productivos).
- **Próximo sub-proyecto:** motor de cálculo de préstamos (TS puro), según el spec §9.
```