# Spec: Remediación de Preparación SaaS — CrédiControl

**Fecha:** 2026-06-09
**Autor:** Auditoría de ingeniería (Claude + Juan David Aguilar)
**Estado:** Aprobado para planificación

---

## Contexto

CrédiControl es un SaaS multi-tenant de crédito y cobranza diaria (mercado: Colombia,
COP) construido en Next.js 16 + Supabase. El núcleo técnico es sólido —multi-tenancy
con RLS, JWT claims personalizados (rol + organization_id vía Custom Access Token Hook),
validación con Zod, audit logs, y separación de lógica de dominio en `lib/domain/`.

Una auditoría completa (arquitectura, backend, seguridad, RLS, UI, enrutamiento,
monitoreo, tests) identificó 13 hallazgos. El sistema **no está aún en producción**;
el objetivo es dejarlo listo para venderse como SaaS.

### Decisiones de alcance tomadas

1. **Plan completo priorizado:** se cubren los 13 hallazgos ordenados por prioridad en
   4 fases. El equipo decide dónde parar al ejecutar.
2. **Sin billing automático:** se mantiene la activación manual de suscripciones por el
   `super_admin`. NO se integra pasarela de pago (Wompi/Mercado Pago/Stripe). Solo se
   implementa el *enforcement* de suscripción (bloquear tenants vencidos/suspendidos).

### Restricción del proyecto

Esta versión de Next.js tiene breaking changes respecto a versiones conocidas. Antes de
escribir código de routing/middleware/server, **leer la guía correspondiente en
`node_modules/next/dist/docs/`** y respetar las notas de deprecación (ver `AGENTS.md`).

### Nota sobre Supabase MCP

El proyecto Supabase vinculado al MCP en el entorno de auditoría (`heibyjbvfiokmduwwawm`,
"iglesiasproyecto-cmyk's Project") **no corresponde** a cobradiario. No fue posible correr
los advisors en vivo contra la base real. Al ejecutar, vincular el proyecto correcto y
correr `get_advisors` (security + performance) tras los cambios DDL.

---

## Hallazgos de la auditoría

### 🔴 Bloqueadores críticos

| # | Hallazgo | Evidencia |
|---|----------|-----------|
| 1 | **No existe `middleware.ts`.** Toda la protección de rutas es client-side (`useAuth()`). Las rutas `/app/*` y `/(super-admin)/*` renderizan en servidor sin verificar sesión. | No hay `middleware.ts` en la raíz. |
| 2 | **Sin billing automático.** No hay pasarela ni webhooks. → *Descartado por decisión de alcance; solo se implementa enforcement (#3).* | Sin referencias a stripe/wompi/billing en el código. |
| 3 | **Suscripciones vencidas no bloquean el API.** `requireApiActor` verifica usuario/rol/profile.activo pero NO `organizations.estado_suscripcion` ni `trial_hasta`. | `lib/api/auth.ts` |
| 4 | **Página de Configuración rota.** Usa defaults hardcodeados; la tabla `tenant_settings` existe pero no se carga ni se guarda. | `app/app/configuracion/page.tsx` |
| 5 | **Endpoint de debug en producción.** | `app/api/debug/me/route.ts` |

### 🟡 Importantes

| # | Hallazgo | Evidencia |
|---|----------|-----------|
| 6 | **Sin onboarding.** No hay wizard post-registro, verificación de email obligatoria, ni guía inicial. | `components/auth/register-form.tsx` |
| 7 | **Sin planes con límites.** `organizations.plan` es `text` libre, sin cuotas por tier. | `0001_schema.sql` |
| 8 | **Rate-limiting NO conectado a ninguna ruta.** El helper `withRateLimit` existe pero ningún endpoint lo usa, ni siquiera el login → sin protección contra fuerza bruta/flood. | `grep` confirmó 0 usos en `app/api`. |
| 9 | **`next.config.ts` vacío.** Sin optimizaciones ni headers globales de producción. | `next.config.ts` |
| 10 | **CSP con `unsafe-inline`** en producción → debilita protección XSS. | `lib/api/security.ts` |
| 11 | **Super-admin panel sin guard server-side.** (Resuelto por #1.) | `app/(super-admin)/layout.tsx` |
| 12 | **Sin emails transaccionales** (bienvenida, reset, aviso de vencimiento de trial). | — |
| 13 | **RLS no optimizado (lint `0003_auth_rls_initplan`).** Las policies llaman `public.current_org_id()` directo → re-evaluación por fila. Best practice: envolver en `(select ...)`. | `0003_rls.sql`, `0002_helpers.sql` |

### 🟢 Fundamentos sólidos (no se tocan salvo lo indicado)

Multi-tenancy con RLS (force RLS en todas las tablas), JWT claims custom, validación Zod
en todos los POST/PUT, audit logs, lógica de dominio aislada, Sentry condicional, health
endpoints (`/api/health`, `/api/ready`), logging estructurado con Pino, schema de DB con
enums/constraints, tabla `tenant_settings` y estados de suscripción correctamente modelados.

---

## Diseño de la solución

Cuatro fases, cada una ejecutable y verificable de forma independiente.

### FASE 0 — Seguridad crítica *(no negociable para producción)*

#### 0.1 Middleware SSR de Supabase
- Crear `middleware.ts` (raíz) + `lib/supabase/middleware.ts` con `updateSession`, según el
  [patrón oficial de SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
- **Regla de oro del patrón:** no ejecutar código entre `createServerClient` y la
  obtención del usuario/claims; devolver siempre el `supabaseResponse` para no romper la
  sincronización de cookies.
- Reglas de enrutamiento:
  - `/app/*` → requiere sesión + rol `admin` o `cobrador`; sin sesión → redirect `/login`.
  - `/(super-admin)/*` → requiere rol `super_admin`; si no, redirect a su dashboard o `/login`.
  - Usuario autenticado en `/login` o `/register` → redirect a su dashboard según rol.
  - `matcher` que excluye `_next/static`, `_next/image`, `favicon`, y assets públicos.
- Leer los claims (`rol`, `organization_id`) del JWT ya verificado para decidir rutas.

#### 0.2 Enforcement de suscripción
- Extender `requireApiActor` (`lib/api/auth.ts`) para cargar el estado del tenant en la
  misma consulta (join `profiles` → `organizations`: `estado_suscripcion`, `trial_hasta`).
- Bloquear si: `suspendido`, `vencido`, o (`trial` y `trial_hasta < hoy`).
  Devolver código `SUBSCRIPTION_EXPIRED`, HTTP **402**.
- `super_admin` exento. Se permiten siempre: `GET /api/auth/me` y cerrar sesión.
- El middleware (0.1) detecta el estado y redirige las **páginas** a `/suscripcion-vencida`
  (página nueva con datos de contacto/renovación y botón de cerrar sesión).
- Añadir `estado_suscripcion`/`trial_hasta` al `ApiActor` para reutilización.

#### 0.3 Rate-limiting aplicado
- Conectar el helper existente a las rutas (hoy 0 usos):
  - `authRateLimit` (5 / 15 min) en login y register.
  - `apiRateLimit` (100 / min) en el catch-all `app/api/[...path]/route.ts`.
- **Fail-closed en producción:** si faltan `UPSTASH_REDIS_REST_URL`/`_TOKEN`, loguear error
  crítico vía Pino (no silenciar). En dev se permite no-op.
- Clave de rate-limit por IP (`x-forwarded-for`) y, donde aplique, por usuario.

#### 0.4 Eliminar endpoint de debug
- Borrar `app/api/debug/me/route.ts` y cualquier referencia.

**Verificación Fase 0:** tests de redirección sin sesión; test de que un tenant vencido
recibe 402; test de que login respeta el rate-limit; confirmar 404 en `/api/debug/me`.

---

### FASE 1 — Funcionalidad core rota

#### 1.1 Configuración conectada a `tenant_settings`
- `GET /api/configuracion`: devuelve merge de `organizations` (nombre, ciudad, teléfono) +
  `tenant_settings`. Si no existe fila de settings, crearla con defaults (upsert lazy).
- `PUT /api/configuracion`: valida con Zod y persiste; solo rol `admin`. Audit log.
- Migración: añadir a `tenant_settings` las columnas que la UI usa y faltan —
  `moneda` (default `'COP'`), `horario_inicio`, `horario_fin`, `color_primario`.
- Unificar placeholder de WhatsApp: estandarizar en `{{cliente}}`/`{{monto}}`/`{{saldo}}`/`{{negocio}}`
  (DB) y ajustar la UI para usar el mismo formato.
- La página deja de usar defaults hardcodeados: el `reset()` del formulario se alimenta del GET.

**Verificación Fase 1:** test contract GET/PUT de configuración; persistencia round-trip;
RLS asegura que un tenant no lee/escribe settings de otro.

---

### FASE 2 — Hardening de plataforma

#### 2.1 `next.config.ts` de producción
- `poweredByHeader: false`, `reactStrictMode: true`.
- `images.remotePatterns` para logos en Supabase Storage.
- Headers de seguridad globales (consolidar con `addSecurityHeaders`).

#### 2.2 RLS optimizado para escala (lint `0003_auth_rls_initplan`)
- Migración que reescribe las policies para envolver los helpers en subquery:
  `organization_id = (select public.current_org_id())`, igual para `current_rol()` e
  `is_super_admin()`. Aplica a todas las tablas con RLS.
- No cambia la semántica de autorización, solo el plan de ejecución (initPlan cacheado).

#### 2.3 CSP sin `unsafe-inline`
- Migrar a CSP basado en **nonce** generado por request en el middleware, propagado a los
  scripts. Eliminar `unsafe-inline` de `script-src` en producción.
- **Tradeoff documentado:** es el cambio más delicado de la fase. Si introduce fricción
  significativa con Next.js, se difiere y se deja registrado el riesgo XSS residual.

**Verificación Fase 2:** re-correr los RLS isolation tests tras el cambio de policies
(sin regresiones de aislamiento); smoke test de que la app carga con el nuevo CSP;
correr `get_advisors` (security + performance) en Supabase.

---

### FASE 3 — Producto vendible (go-to-market)

#### 3.1 Onboarding
- Verificación de email obligatoria antes de acceder a `/app/*` (Supabase confirm email).
- Wizard post-registro: configurar negocio (`tenant_settings`) → crear primer cobrador →
  crear primer cliente. Estado de onboarding persistido (p. ej. columna
  `onboarding_completed` en `organizations`); el middleware/cliente redirige al wizard
  hasta completarlo.

#### 3.2 Planes con límites
- Definir tiers (`basico`, `pro`) con límites: máx. cobradores, máx. préstamos activos.
- Config de límites por plan (tabla `plan_limits` o constante versionada).
- Enforcement en endpoints de creación (`usuarios`, `prestamos`): rechazar al superar
  cuota con error claro. Indicador de uso/cupo en la UI.

#### 3.3 Emails transaccionales
- Configurar SMTP propio en producción (Resend o SES; el default de Supabase es solo dev).
- Templates: bienvenida, reset de contraseña, aviso de vencimiento de trial.
- Aviso de vencimiento: job programado (pg_cron + Edge Function) que notifica N días antes.

#### 3.4 Activación manual mejorada (super-admin)
- Pulir panel super-admin para activar / extender período / suspender, con registro en
  `audit_logs` (ya parcialmente implementado) y visualización de fechas de vencimiento y
  estado por tenant.

**Verificación Fase 3:** test del gate de onboarding; test de enforcement de límites por
plan; envío de email de prueba en staging; flujo manual de activación/suspensión con
verificación de que el enforcement (0.2) responde al cambio de estado.

---

## Estrategia de testing

- Base existente: vitest (unit + integration + contract) y `tests/rls-isolation.test.ts`.
- Regla: cada fase añade/actualiza tests antes de marcarse completa.
- Tras cambios DDL: correr advisors de Supabase (security + performance).
- Verificación manual con las skills `verify`/`run` al cerrar cada fase.

## Fuera de alcance (explícito)

- Integración de pasarela de pago / billing automático / webhooks de pago.
- Self-service de upgrade/downgrade de plan con cobro.
- Cualquier refactor no relacionado con los 13 hallazgos.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| CSP por nonce rompe scripts de Next.js | Diferir 2.3 si hay fricción; documentar riesgo residual. |
| Cambio de policies RLS introduce regresión de aislamiento | RLS isolation tests obligatorios antes de merge. |
| Enforcement de suscripción bloquea casos legítimos (super_admin, renovación) | Exenciones explícitas + página de renovación accesible. |
| Breaking changes de esta versión de Next.js | Leer `node_modules/next/dist/docs/` antes de codear middleware/routing. |

## Criterios de aceptación (preparación SaaS)

1. Ninguna ruta protegida es accesible sin sesión válida server-side.
2. Un tenant `vencido`/`suspendido`/trial expirado no puede operar el API (402) y es
   redirigido a renovación.
3. Login y API tienen rate-limiting activo; fail-closed en producción.
4. La configuración del tenant se carga y persiste contra `tenant_settings`.
5. Sin endpoints de debug en producción.
6. RLS optimizado (lint resuelto) sin regresión de aislamiento.
7. (Si se ejecuta Fase 3) onboarding guiado, límites por plan aplicados, emails
   transaccionales funcionando.
