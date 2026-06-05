# Prompt Para Agente MCP De Migraciones Supabase

Necesito que te encargues exclusivamente de las migraciones y verificacion Supabase del proyecto `cobradiario`.

## Contexto

- Proyecto: CrediControl SaaS para cobranzas diarias.
- Stack: Supabase Postgres/Auth/Storage + Next.js 16 + TypeScript.
- Ya existe fundacion con 7 tablas base, RLS, helpers JWT, auth hook y trigger signup.
- Otro agente esta implementando backend TypeScript/API/tests y NO debe aplicar migraciones.
- Tu responsabilidad es aplicar y verificar las migraciones de Supabase usando MCP.

## Archivos Que Debes Leer

1. `SRS_CrédiControl_SaaS_v1.md`
2. `docs/superpowers/specs/2026-06-04-backend-produccion-srs-design.md`
3. `docs/superpowers/plans/2026-06-04-backend-produccion-srs.md`
4. Migraciones existentes en `supabase/migrations/`

## Migracion Inicial A Revisar/Aplicar

Hay una migracion local creada para core productivo:

`supabase/migrations/20260605043814_production_core.sql`

Debes revisar si ya existe algo equivalente en la BD antes de aplicar. Si no existe, aplicala via MCP `apply_migration` con nombre `production_core` o con el nombre que corresponda a la convencion MCP.

## Requisitos Supabase Obligatorios

- Usar documentacion actual de Supabase si tienes duda.
- No usar `user_metadata` para autorizacion.
- Mantener RLS forzado en toda tabla expuesta.
- Para nuevas tablas publicas, agregar `GRANT` explicitos a `authenticated` segun minimo necesario.
- Recordar el cambio 2026: tablas nuevas no necesariamente quedan expuestas al Data API automaticamente; por eso `GRANT` y RLS deben ir juntos.
- Evitar `SECURITY DEFINER` en `public` salvo justificacion fuerte. Preferir `SECURITY INVOKER`.
- Si una funcion requiere privilegios elevados, proponer esquema privado, validacion `auth.uid()` y grants minimos.
- Ejecutar advisors de seguridad y performance al final, o reportar si no tienes permisos.

## Tareas Concretas

1. Inspecciona tablas existentes:
   - `tenant_settings`
   - `prestamo_saldos`
   - `pagos`
   - `visitas_cobro`
   - `audit_logs`
   - `subscription_plans`
   - `tenant_subscriptions`
   - `subscription_payments`
   - `notification_events`

2. Inspecciona enum `estado_cuota` y confirma si contiene `cancelado`.

3. Aplica `production_core` si falta:
   - agrega `cancelado` a `estado_cuota`
   - crea `tenant_settings`
   - crea `prestamo_saldos`
   - crea `pagos`
   - crea `visitas_cobro`
   - crea `audit_logs`
   - agrega columnas a `cronograma_pagos`: `monto_capital`, `monto_interes`, `saldo_estimado`
   - crea indices del archivo local

4. Crea/aplica una migracion `production_rls` para tablas nuevas core:
   - habilitar y forzar RLS en `tenant_settings`, `prestamo_saldos`, `pagos`, `visitas_cobro`, `audit_logs`
   - grants minimos a `authenticated`
   - policies por `organization_id`, rol y `auth.uid()` segun spec
   - `audit_logs` solo visible para `admin` del tenant y `super_admin`; insert permitido para acciones del tenant

5. Crea/aplica RPC core si corresponde:
   - `public.audit_action(...) returns void`
   - `public.register_payment(...) returns uuid`
   - usar `security invoker`
   - actualizar `pagos`, `cronograma_pagos`, `prestamo_saldos`, `prestamos`, `audit_logs` atomica y consistentemente

6. Crea/aplica migraciones de operacion cuando el backend lo requiera:
   - `run_mora_detection`
   - `refinance_loan`
   - `cancel_loan`
   - `close_route_cash`

7. Crea/aplica migraciones SaaS cuando el backend lo requiera:
   - `subscription_plans`
   - `tenant_subscriptions`
   - `subscription_payments`
   - `notification_events`
   - RLS/grants para esas tablas

8. Verifica despues de aplicar:
   - tablas existen
   - RLS y force RLS activos
   - grants existen
   - policies existen
   - funciones existen y tienen grants adecuados
   - advisors security/performance sin hallazgos criticos, o lista hallazgos con remediacion

## Entregable Que Debes Devolver

Devuelve un reporte breve con:

- Migraciones aplicadas y nombres.
- SQL exacto aplicado o referencia al archivo.
- Tablas/funciones creadas.
- Estado RLS/grants/policies.
- Advisors: security/performance.
- Pendientes o bloqueos.
- Si regeneraste tipos, indica si `lib/database.types.ts` debe actualizarse en repo.

## No Hagas

- No modificar frontend.
- No tocar UI.
- No cambiar codigo TypeScript salvo tipos generados si fue acordado.
- No deshabilitar RLS.
- No usar service role en cliente.
- No crear policies amplias tipo `using (true)` para datos de tenant, excepto tablas publicas de planes si se decide que todos los usuarios autenticados pueden ver planes.
