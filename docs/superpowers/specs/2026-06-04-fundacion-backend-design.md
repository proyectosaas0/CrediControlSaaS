# CrédiControl — Diseño: Fundación (Backend)

**Fecha:** 2026-06-04
**Sub-proyecto:** 1 de N — Fundación (Foundation)
**Documento padre:** `SRS_CrédiControl_SaaS_v1.md`
**Estado:** Aprobado para planificación

---

## 1. Contexto y alcance

El SRS de CrédiControl describe un SaaS multi-tenant de cobranzas diarias (pagadiario)
con ~10 módulos repartidos en un roadmap de 6 fases. Es demasiado grande para una sola
especificación, así que se descompone en sub-proyectos, cada uno con su propio ciclo
spec → plan → implementación.

Este documento cubre el **primer** sub-proyecto: la **Fundación**, la capa de backend y
datos de la que dependen todos los demás módulos.

### En alcance

- Proyecto Supabase remoto (`project_ref=aamfmqhhmuwnyqdsqklr`), gestionado vía MCP.
- Las 7 tablas del SRS §4 con RLS, índices y claves foráneas.
- Multi-tenancy por Row Level Security usando **claims en el JWT** (Custom Access Token Hook).
- Roles: `super_admin` / `admin` / `cobrador`.
- Trigger de "crear organización al registrarse".
- Cableado de cliente Supabase (`@supabase/ssr`) y middleware en Next 16.
- Tipos TypeScript generados desde el esquema.
- Script de seed con 2 organizaciones de prueba.
- Pruebas automatizadas de aislamiento RLS.

### Fuera de alcance (sub-proyectos posteriores)

- **Toda la UI** — se construye en un repo/flujo aparte. La Fundación solo expone backend
  y helpers para que esa UI los consuma.
- Onboarding completo del SRS §3.2 (verificación de correo por Resend, tutorial de 3 pasos).
- Lógica de negocio: cálculo de cuotas, modelos de interés, generación de cronograma,
  detección de mora, refinanciamiento, cierre de caja, reportes.
- Panel de Super Admin, suscripciones, pagos SaaS, WhatsApp, geolocalización.

### Decisiones tomadas durante el brainstorming

| Tema | Decisión |
|------|----------|
| Por dónde empezar | Fundación (backend) primero |
| Entorno Supabase | Proyecto remoto vía MCP |
| Alcance del esquema | Completo: las 7 tablas desde ya |
| UI | Se hace aparte; la Fundación es solo backend |
| Estrategia RLS | Opción A — claims en el JWT (Custom Access Token Hook) |
| Tipos de estado | Enums de Postgres (no `text + CHECK`) |
| Tipo de dinero | `numeric(14,2)` |
| Búsqueda por nombre | `pg_trgm` incluido desde la Fundación |
| Trial por defecto | 15 días |

### Nota de versiones

El SRS especifica Next.js 14 + shadcn/ui, pero el repo está en **Next.js 16.2.7** + React
19.2.4 + Tailwind v4. El `AGENTS.md` advierte que este Next tiene cambios de API frente a
lo conocido. La API exacta de middleware, route handlers y `@supabase/ssr` se confirmará
contra `node_modules/next/dist/docs/` al implementar. La config exacta del auth hook se
confirmará contra los docs de Supabase.

---

## 2. Arquitectura y estructura de archivos

La Fundación es una capa de backend/datos dentro del repo Next, **sin UI**.

```
supabase/
  migrations/
    0001_schema.sql          ← 7 tablas + enums + índices + FKs + pg_trgm
    0002_rls.sql             ← políticas RLS por tabla
    0003_auth_hook.sql       ← custom access token hook (inyecta org_id + rol)
    0004_signup_trigger.sql  ← al registrarse: crea organization + profile admin

scripts/
  seed.ts                    ← datos de prueba (usa service role + Auth Admin API)

lib/
  supabase/
    client.ts      ← cliente navegador
    server.ts      ← cliente servidor (RSC / route handlers)
    middleware.ts  ← refresco de sesión para el middleware
  auth.ts          ← getUser(), getRole(), getOrgId(), requireRole()
  database.types.ts ← tipos generados desde Supabase

middleware.ts      ← raíz: protege rutas y refresca sesión

tests/
  rls-isolation.test.ts ← pruebas de aislamiento multi-tenant
```

### Fronteras y responsabilidades

- **`supabase/migrations/`** — única fuente de verdad del esquema y la seguridad. Todo
  cambio de BD pasa por una migración versionada, reproducible, aplicable en orden.
- **`lib/supabase/*`** — único lugar que sabe construir un cliente Supabase. La UI (aparte)
  importa de aquí y nunca instancia clientes por su cuenta.
- **`lib/auth.ts`** — la API que la UI consume para saber quién es el usuario y su rol/org.
  Oculta los detalles del JWT detrás de funciones simples.
- **`tests/`** — red de seguridad del aislamiento; se corre antes de cualquier despliegue.

Objetivo de diseño: la UI solo necesita conocer `lib/auth.ts`, `lib/supabase/*` y los
tipos. Todo lo demás (RLS, hooks, triggers) es interno y se puede cambiar sin romper a
quien consume.

---

## 3. Esquema de base de datos

Las 7 tablas del SRS §4 (`organizations`, `profiles`, `clientes`, `prestamos`,
`cronograma_pagos`, `mora_registros`, `cierres_caja`) con sus columnas tal como las define
el SRS, más las siguientes decisiones de diseño.

### 3.1 Enums de Postgres

Vocabularios controlados como tipos enum (la BD rechaza valores inválidos; los tipos TS
generados salen como uniones):

| Enum | Valores |
|------|---------|
| `rol` | `super_admin`, `admin`, `cobrador` |
| `estado_suscripcion` | `activo`, `trial`, `vencido`, `suspendido` |
| `modelo_interes` | `cuota_fija`, `solo_interes`, `sobre_saldo` |
| `estado_prestamo` | `activo`, `en_mora`, `saldado`, `refinanciado`, `cancelado` |
| `estado_cuota` | `pendiente`, `pagado`, `parcial`, `vencido` |
| `medio_pago` | `efectivo`, `nequi`, `transferencia` |
| `estado_mora` | `activa`, `pagada`, `condonada` |

### 3.2 Otras decisiones

- **Dinero como `numeric(14,2)`** en todos los montos (capital, cuota, totales, mora).
- **`organization_id uuid`** en cada tabla de negocio, con FK a `organizations(id)`.
  En `profiles` es **nullable** — solo para super_admin (global, sin tenant).
- **`created_at timestamptz default now()`** en todas las tablas.
- **FKs con `on delete restrict`** por defecto — no se borran datos financieros en cascada
  por accidente. Clientes y préstamos se **desactivan** (`activo=false`), no se borran.
- **`profiles.id` referencia `auth.users(id)`** con `on delete cascade`.

### 3.3 Plan de índices (migración `0001_schema.sql`)

Pensado para las metas de rendimiento del SRS §5 (ruta <1.5s, pago <2s, dashboard con
500 préstamos <3s).

**De aislamiento:** índice simple en `organization_id` en **todas** las tablas.

**Compuestos para las consultas más calientes:**

| Tabla | Índice | Sirve para |
|-------|--------|-----------|
| `cronograma_pagos` | `(organization_id, fecha_esperada, estado)` | Ruta del cobrador del día / cobros de hoy del admin |
| `cronograma_pagos` | `(prestamo_id)` | Cronograma completo de un préstamo |
| `prestamos` | `(organization_id, cobrador_id, estado)` | Agrupar ruta por cobrador |
| `prestamos` | `(organization_id, estado)` | Dashboard: activos / en mora |
| `prestamos` | `(cliente_id)` | Historial de préstamos del cliente |
| `mora_registros` | `(organization_id, estado)` | Panel de mora |
| `cierres_caja` | `(organization_id, fecha)` y `(cobrador_id, fecha)` | Cierres por día y por cobrador |
| `profiles` | `(organization_id, rol)` | Listar cobradores de un tenant |
| `clientes` | `(organization_id, cedula)` | Búsqueda exacta por cédula |

**Búsqueda por nombre (SRS §3.3):** extensión `pg_trgm` + índice **GIN trigram** sobre
`clientes.nombre` para búsquedas parciales rápidas (`nombre ILIKE '%...%'`) sin seq scan.

---

## 4. RLS, auth hook y roles

### 4.1 Custom Access Token Hook

Función `public.custom_access_token_hook(event jsonb)` que en cada emisión de token lee el
`profile` del usuario e inyecta dos claims en el JWT: `organization_id` y `rol`. Se
registra como *Custom Access Token Hook* en Supabase Auth. A partir de ahí, las políticas
leen del JWT y no de tablas (rápido, sin recursión).

### 4.2 Funciones auxiliares (leen del JWT)

- `auth.org_id()` → `(auth.jwt()->>'organization_id')::uuid`
- `auth.rol()` → `auth.jwt()->>'rol'`
- `auth.is_super_admin()` → `auth.rol() = 'super_admin'`

### 4.3 Políticas RLS

RLS **activado y forzado** (`enable` + `force`) en las 7 tablas. Se separan políticas de
lectura (`SELECT`) y de escritura (`INSERT/UPDATE/DELETE`).

| Alcance | Regla `USING` |
|--------|----------------|
| Base (tablas de negocio) | `organization_id = auth.org_id() OR auth.is_super_admin()` |
| Cobrador (en `prestamos` y `cronograma_pagos`) | además `cobrador_id = auth.uid()` |
| `profiles` | `organization_id = auth.org_id() OR id = auth.uid() OR auth.is_super_admin()` |

Reglas de escritura:
- **Cobrador:** puede `INSERT/UPDATE` pagos en *sus* cuotas (`cronograma_pagos` con
  `cobrador_id = auth.uid()`). No puede crear préstamos ni modificar clientes.
- **Admin:** acceso total dentro de su `organization_id`.
- **Super_admin:** acceso global (todas las orgs).

Esto cubre directamente el SRS §7.4 (un cobrador no puede ver rutas de otro ni entrar al
dominio del admin).

**Fail-closed:** si falta el claim `organization_id`, el acceso se deniega por defecto
(nunca fail-open).

### 4.4 Trigger de registro (`0004_signup_trigger.sql`)

Sobre `auth.users` al insertar, se ramifica según `raw_user_meta_data`:

- **Sin `organization_id` en metadata** → prestamista nuevo: crea `organizations`
  (`estado_suscripcion='trial'`, `trial_hasta = now() + 15 días`) y un `profile` con
  `rol='admin'`.
- **Con `organization_id` en metadata** → cobrador invitado por su admin: crea solo el
  `profile` con el rol indicado, ligado a esa org.

El trigger es **idempotente** (no duplica organización si se reintenta).

El **super_admin** no se autogenera: se siembra a mano en el seed / una migración, con
`organization_id = NULL`.

### 4.5 Frescura de claims

Los claims viven en el token (~1h). Un cambio de rol aplica al siguiente refresh del token.
Irrelevante para este dominio: `organization_id` nunca cambia por usuario y los roles casi
nunca cambian.

---

## 5. Cableado en Next 16 y API de auth

### 5.1 Clientes Supabase (`lib/supabase/`) con `@supabase/ssr`

- `client.ts` → cliente de navegador (componentes cliente).
- `server.ts` → cliente de servidor que lee/escribe cookies (RSC y route handlers).
- `middleware.ts` → helper que refresca la sesión en cada request.

### 5.2 `middleware.ts` (raíz)

Protege rutas y mantiene viva la sesión. Como la UI vive aparte, se deja **configurable**:
una lista de prefijos públicos/privados, fácil de ajustar al conectar las páginas. No asume
rutas concretas del diseño de UI.

### 5.3 `lib/auth.ts` — API que consume la UI

Oculta los detalles del JWT:

- `getUser()` → usuario actual o `null`.
- `getRole()` / `getOrgId()` → leen los claims del token.
- `requireRole(rol)` → helper para route handlers: rechaza/redirige si el rol no aplica.

La firma exacta (tipado de cookies y middleware en Next 16) se confirma contra
`node_modules/next/dist/docs/` al implementar.

### 5.4 Tipos (`lib/database.types.ts`)

Generados desde el esquema (`supabase gen types typescript`). La UI importa `Database` y
obtiene todo tipado, con los enums como uniones de strings.

---

## 6. Seed y pruebas de aislamiento

### 6.1 Seed (`scripts/seed.ts`)

Script TypeScript que usa el **service role** y la **Auth Admin API**
(`auth.admin.createUser`) — crear usuarios reales en `auth.users` no es posible con SQL
plano. Crea:

- 1 **super_admin** (`organization_id = NULL`).
- **Org A**: admin + 2 cobradores + 3 clientes + 2 préstamos con cronograma.
- **Org B**: admin + 1 cobrador + 2 clientes + 1 préstamo.

Datos suficientes para que la UI tenga con qué trabajar y para probar el aislamiento real.

### 6.2 Pruebas RLS (`tests/rls-isolation.test.ts`)

Cada prueba autentica como un usuario real y verifica:

- Admin de A consulta tablas de negocio → **0 filas** de B (SRS §7.1).
- Cobrador de A solo ve préstamos/cuotas con su `cobrador_id`, no los del otro cobrador
  (SRS §7.4).
- Cobrador **no** puede `INSERT` un préstamo (solo el admin).
- Super_admin ve datos de A **y** B.
- Petición sin auth → sin filas / error (no datos vacíos silenciosos).

---

## 7. Manejo de errores y casos borde

- **Trigger de registro idempotente** — no duplica org si se reintenta.
- **Claim `organization_id` faltante** → acceso denegado por defecto (fail-closed).
- **Migraciones reversibles** y aplicables en orden estricto (`0001` → `0004`).
- **Borrado de datos financieros** restringido por FK; se prefiere desactivar.

---

## 8. Criterios de aceptación

La Fundación está completa cuando:

1. Las 4 migraciones aplican limpias sobre el proyecto Supabase remoto.
2. Existen las 7 tablas con sus enums, índices, FKs y RLS forzado.
3. El auth hook inyecta `organization_id` y `rol` en el JWT.
4. El trigger crea org + admin al registrarse un prestamista; crea solo profile para un
   cobrador invitado.
5. El seed crea super_admin + Org A + Org B con sus usuarios y datos.
6. Los helpers de `lib/supabase/*` y `lib/auth.ts` funcionan en Next 16.
7. Los tipos TS están generados en `lib/database.types.ts`.
8. **Todas** las pruebas de aislamiento RLS pasan.

---

## 9. Próximos sub-proyectos (referencia, no en alcance)

Orden sugerido tras la Fundación, alineado con el roadmap del SRS §6:

1. **Motor de cálculo de préstamos** — TS puro: 3 modelos de interés, generación de
   cronograma, exclusión de fines de semana, cálculo de mora. Testeable sin infraestructura.
2. **Clientes** — CRUD + score + búsqueda.
3. **Préstamos** — creación en 3 pasos, estados, refinanciamiento.
4. **Rutas y cobros diarios** — el flujo crítico del cobrador.
5. **Mora** (job nocturno), **Caja**, **Reportes**.
6. **Onboarding completo**, **Super Admin**, **Suscripciones**.

Cada uno con su propio ciclo spec → plan → implementación.
