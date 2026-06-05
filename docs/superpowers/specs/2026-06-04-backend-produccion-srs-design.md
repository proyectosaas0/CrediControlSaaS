# Backend Produccion SRS Completo — Diseno

**Objetivo:** Convertir la fundacion actual de Supabase + Next.js en un backend REST listo para produccion que cubra el SRS completo de CrediControl, manteniendo aislamiento multi-tenant por RLS y contratos claros para el desarrollador frontend.

**Alcance aprobado:** SRS completo con API Routes REST (`app/api/.../route.ts`) como contrato principal del frontend.

**Estado inicial:** Ya existen migraciones base, RLS, Auth hook, trigger de registro, clientes Supabase, tipos generados, seed y pruebas iniciales de aislamiento. La logica de negocio aun no existe.

---

## Principios

- El frontend no calcula dinero. El backend calcula cuotas, cronogramas, saldos, mora, estados y reportes.
- Toda accion critica pasa por API REST validada: crear prestamo, registrar pago, refinanciar, cancelar, cerrar caja, modificar suscripcion, impersonar.
- Supabase RLS sigue siendo la defensa de datos. Los endpoints tambien validan rol y tenant para devolver `401`, `403`, `404` o `422` explicitos.
- Las operaciones financieras se ejecutan en transacciones Postgres mediante RPC/funciones SQL cuando actualizan varias tablas.
- Cada accion critica genera auditoria con usuario, timestamp, entidad, estado anterior y estado nuevo.
- El contrato REST debe ser estable para el frontend: respuestas JSON consistentes, errores tipados y validacion con Zod.
- El desarrollo se divide por fases del SRS para poder probar e integrar verticalmente.

---

## Arquitectura

### Capas

1. **API REST Next.js**
   - Archivos en `app/api/**/route.ts`.
   - Autenticacion por cookies Supabase SSR.
   - Valida entrada con Zod.
   - Llama servicios TS o RPC Postgres.
   - Devuelve JSON normalizado.

2. **Servicios de dominio TypeScript**
   - Archivos en `lib/domain/**`.
   - Contienen calculos puros y orquestacion de casos de uso.
   - No conocen React ni UI.
   - Se prueban con Vitest sin tocar Supabase cuando sea posible.

3. **Funciones RPC Postgres**
   - Migraciones en `supabase/migrations/*.sql`.
   - Ejecutan transacciones atomicas: crear prestamo con cronograma, registrar pago, liquidar, refinanciar, correr mora, cerrar caja.
   - Usan `security invoker` por defecto. Si una funcion requiere `security definer`, debe vivir en esquema privado, validar `auth.uid()` y tener grants minimos.

4. **Base de datos Supabase**
   - Tablas existentes se conservan.
   - Se agregan tablas para pagos, auditoria, configuracion tenant, rutas/visitas, suscripciones, planes, storage metadata y notificaciones.
   - RLS forzado en todas las tablas expuestas.

5. **Jobs y webhooks**
   - Jobs programados para mora y reportes derivados usando Supabase Cron/pg_cron o endpoint protegido por secreto.
   - Webhooks para pagos SaaS y eventos externos.

---

## Modelo De Datos Adicional

### `tenant_settings`

Configuracion operativa por organizacion.

- `organization_id uuid primary key references organizations(id)`
- `tasa_interes_default numeric not null default 20`
- `mora_tipo text not null default 'porcentaje' check in ('porcentaje','monto_fijo')`
- `mora_valor numeric not null default 0`
- `dias_gracia integer not null default 0`
- `cobrar_sabados_default boolean not null default true`
- `cobrar_domingos_default boolean not null default false`
- `whatsapp_template text not null`
- `geolocalizacion_requerida boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `pagos`

Historial inmutable de pagos registrados.

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null`
- `prestamo_id uuid not null`
- `cronograma_pago_id uuid null`
- `cliente_id uuid not null`
- `cobrador_id uuid not null`
- `registrado_por uuid not null`
- `monto numeric(14,2) not null check (monto > 0)`
- `medio_pago medio_pago not null`
- `tipo text not null check in ('cuota','parcial','vencida','mora','liquidacion')`
- `lat numeric null`
- `lng numeric null`
- `nota text null`
- `created_at timestamptz not null default now()`

### `prestamo_saldos`

Estado financiero materializado por prestamo para consultas rapidas.

- `prestamo_id uuid primary key references prestamos(id)`
- `organization_id uuid not null`
- `capital_original numeric(14,2) not null`
- `total_original numeric(14,2) not null`
- `total_pagado numeric(14,2) not null default 0`
- `saldo_pendiente numeric(14,2) not null`
- `mora_pendiente numeric(14,2) not null default 0`
- `updated_at timestamptz not null default now()`

### `visitas_cobro`

Evidencia de ruta aunque no haya pago.

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null`
- `cronograma_pago_id uuid not null`
- `prestamo_id uuid not null`
- `cliente_id uuid not null`
- `cobrador_id uuid not null`
- `resultado text not null check in ('pagado','parcial','no_encontrado','promesa_pago','rechazado')`
- `lat numeric null`
- `lng numeric null`
- `nota text null`
- `created_at timestamptz not null default now()`

### `audit_logs`

Auditoria obligatoria del SRS.

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid null`
- `actor_id uuid null`
- `actor_rol text null`
- `accion text not null`
- `entidad text not null`
- `entidad_id uuid null`
- `estado_anterior jsonb null`
- `estado_nuevo jsonb null`
- `ip inet null`
- `user_agent text null`
- `created_at timestamptz not null default now()`

### `subscription_plans`

Planes comerciales del SaaS.

- `id uuid primary key default gen_random_uuid()`
- `nombre text not null`
- `precio_mensual numeric(14,2) not null`
- `limite_cobradores integer not null`
- `limite_prestamos_activos integer not null`
- `features jsonb not null default '{}'::jsonb`
- `activo boolean not null default true`
- `created_at timestamptz not null default now()`

### `tenant_subscriptions`

Suscripcion por tenant.

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id)`
- `plan_id uuid not null references subscription_plans(id)`
- `estado text not null check in ('trial','activa','gracia','vencida','cancelada','suspendida')`
- `periodo_inicio date not null`
- `periodo_fin date not null`
- `trial_hasta date null`
- `provider text null check in ('wompi','stripe','manual')`
- `provider_customer_id text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `subscription_payments`

Historial de pagos de suscripcion.

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null`
- `subscription_id uuid not null`
- `provider text not null`
- `provider_payment_id text null`
- `monto numeric(14,2) not null`
- `estado text not null check in ('pendiente','aprobado','rechazado','reembolsado')`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

### `notification_events`

Registro de emails/notificaciones enviadas o pendientes.

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid null`
- `user_id uuid null`
- `canal text not null check in ('email','whatsapp_link','sistema')`
- `tipo text not null`
- `destino text null`
- `payload jsonb not null default '{}'::jsonb`
- `estado text not null check in ('pendiente','enviado','fallido')`
- `created_at timestamptz not null default now()`

---

## Contrato REST

### Formato De Respuesta

Exito:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Entrada invalida",
    "details": {}
  }
}
```

Codigos estandar:

- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 CONFLICT`
- `422 VALIDATION_ERROR`
- `500 INTERNAL_ERROR`

### Auth

- `GET /api/auth/me`
  - Devuelve usuario, rol, organization_id, tenant, settings, suscripcion y permisos.

### Clientes

- `GET /api/clientes?search=&activo=&page=&pageSize=`
- `POST /api/clientes`
- `GET /api/clientes/[id]`
- `PATCH /api/clientes/[id]`
- `DELETE /api/clientes/[id]` desactiva, no borra historial.

### Cobradores

- `GET /api/cobradores`
- `POST /api/cobradores` crea/invita usuario cobrador.
- `PATCH /api/cobradores/[id]`
- `DELETE /api/cobradores/[id]` desactiva.

### Prestamos

- `GET /api/prestamos?estado=&clienteId=&cobradorId=&page=&pageSize=`
- `POST /api/prestamos` crea prestamo y cronograma en una transaccion.
- `GET /api/prestamos/[id]`
- `PATCH /api/prestamos/[id]/cancelar`
- `POST /api/prestamos/[id]/refinanciar`
- `GET /api/prestamos/[id]/cronograma`

### Rutas Y Cronograma

- `GET /api/ruta/hoy?cobradorId=`
- `POST /api/ruta/visitas` registra no encontrado/promesa/rechazado.
- `GET /api/cronograma?fecha=&estado=&cobradorId=`

### Pagos

- `POST /api/pagos`
  - Registra pago completo, parcial, vencido, mora o liquidacion.
  - Actualiza cuota, saldo, estado de prestamo, caja y auditoria.
- `GET /api/pagos?prestamoId=&clienteId=&fechaInicio=&fechaFin=`
- `GET /api/pagos/[id]/comprobante`
  - Devuelve datos y mensaje WhatsApp precargado.

### Mora

- `GET /api/mora?estado=&diasMin=&cobradorId=`
- `POST /api/mora/run`
  - Endpoint protegido por secreto o super_admin para ejecutar deteccion manual.
- `POST /api/mora/[id]/pago`
- `POST /api/mora/[id]/condonar`

### Caja

- `GET /api/caja/resumen?fecha=&cobradorId=`
- `POST /api/caja/cierre-ruta`
- `POST /api/caja/cierre-general`
- `GET /api/caja/historial?fechaInicio=&fechaFin=&cobradorId=`

### Reportes

- `GET /api/reportes/resumen?desde=&hasta=`
- `GET /api/reportes/cobradores?desde=&hasta=`
- `GET /api/reportes/cartera-riesgo`
- `GET /api/reportes/proyeccion?dias=30`
- `GET /api/reportes/export?tipo=&desde=&hasta=`

### Tenant Configuracion

- `GET /api/tenant/configuracion`
- `PATCH /api/tenant/configuracion`
- `POST /api/tenant/logo`

### Super Admin

- `GET /api/super-admin/tenants`
- `POST /api/super-admin/tenants`
- `GET /api/super-admin/tenants/[id]`
- `PATCH /api/super-admin/tenants/[id]`
- `POST /api/super-admin/tenants/[id]/suspender`
- `POST /api/super-admin/tenants/[id]/activar`
- `POST /api/super-admin/tenants/[id]/extender-periodo`
- `GET /api/super-admin/metricas`
- `GET /api/super-admin/subscriptions`
- `POST /api/super-admin/plans`
- `PATCH /api/super-admin/plans/[id]`

### Webhooks

- `POST /api/webhooks/subscription-payment`
  - Recibe Wompi/Stripe/manual adapter.
  - Verifica firma o secreto.
  - Actualiza suscripcion y auditoria.

---

## Logica Financiera

### Cuota Fija

- `total_pagar = capital + (capital * tasa_mensual / 100)`
- `cuota_diaria = total_pagar / dias_habiles`
- El cronograma reparte el total en `dias_habiles`; el ultimo dia ajusta centavos.

### Solo Interes

- `interes_total = capital * tasa_mensual / 100`
- `interes_diario = interes_total / dias_habiles`
- Cuotas 1..N-1 cobran interes.
- Ultima cuota cobra `capital + interes_diario`.

### Sobre Saldo

- El saldo baja con cada abono a capital.
- El interes diario se calcula sobre saldo pendiente.
- Cada cuota registra `monto_interes`, `monto_capital` y `saldo_estimado` mediante columnas adicionales en `cronograma_pagos`.

### Fines De Semana

- `excluir_sabados` y `excluir_domingos` determinan fechas del cronograma.
- `dias_habiles` representa numero real de cuotas generadas.
- La fecha final es la fecha de la ultima cuota.

### Pagos Parciales

- Si `monto_pagado < monto_esperado`, la cuota queda `parcial`.
- El saldo pendiente baja por el monto real recibido.
- La diferencia queda pendiente en la misma cuota y aparece en cobros vencidos.

### Liquidacion Total

- Si el pago cubre `saldo_pendiente + mora_pendiente`, el prestamo pasa a `saldado`.
- Se agregara `cancelado` al enum `estado_cuota`.
- Las cuotas futuras no cubiertas individualmente por el pago de liquidacion se marcan `cancelado` para preservar historial sin inflar recaudo.
- Las cuotas vencidas o actuales cubiertas por la liquidacion se marcan `pagado` y quedan asociadas al pago de liquidacion.

### Refinanciamiento

- Requiere admin.
- Calcula saldo actual del prestamo anterior.
- Nuevo capital debe ser mayor o igual al saldo pendiente.
- Prestamo anterior pasa a `refinanciado`.
- Nuevo prestamo queda `activo` con `prestamo_anterior_id`.
- Todo se ejecuta en una transaccion.

### Mora

- Job nocturno revisa cuotas con `fecha_esperada < current_date` y estado `pendiente` o `parcial`.
- Respeta `dias_gracia` de `tenant_settings`.
- Crea/actualiza `mora_registros`.
- Marca prestamo como `en_mora` si tiene mora activa.
- Recargo:
  - `porcentaje`: `saldo_vencido * mora_valor / 100 * dias_mora`
  - `monto_fijo`: `mora_valor * dias_mora`

---

## Permisos

### Super Admin

- Acceso global a tenants, suscripciones, metricas, planes y soporte.
- Puede activar/suspender organizaciones.
- Puede crear organizacion manual.
- Puede resetear proceso de onboarding o periodo trial.
- Impersonacion queda como backend auditado; no se implementa como acceso silencioso sin log.

### Admin

- Acceso total a su organizacion.
- Puede crear clientes, cobradores, prestamos, refinanciar, cancelar, cerrar caja general, configurar tenant y ver reportes.

### Cobrador

- Ve solo su ruta/cuotas asignadas.
- Registra pagos y visitas de sus cuotas.
- Crea cierre de ruta propio.
- No crea prestamos ni ve reportes globales.

---

## Storage

- Bucket privado `tenant-assets` para logos y documentos.
- Ruta de objeto: `{organization_id}/logos/{filename}` y `{organization_id}/documents/{filename}`.
- RLS/policies de Storage:
  - Admin del tenant puede subir/actualizar logo.
  - Usuarios del tenant pueden leer logo/documentos permitidos.
  - Super admin puede leer todo.
- El endpoint `POST /api/tenant/logo` sube usando servidor y actualiza `organizations.logo_url`.

---

## Emails Y Notificaciones

- Resend se usara para emails transaccionales.
- Eventos minimos:
  - bienvenida al prestamista,
  - invitacion a cobrador,
  - alerta de suscripcion vencida,
  - alerta interna de error critico,
  - notificacion de mora opcional.
- WhatsApp no se envia por API externa en v1; se genera `wa.me` con mensaje precargado desde `/api/pagos/[id]/comprobante`.

---

## Produccion Y Seguridad

- Validar variables requeridas al arrancar: Supabase URL, publishable/anon key, service role, webhook secret, Resend key, storage bucket.
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
- Todas las tablas en `public` tienen RLS forzado.
- Se agregan grants explicitos a `authenticated` para tablas expuestas al Data API si la configuracion actual de Supabase lo requiere.
- JWT expira en 3600 segundos.
- `profiles.activo = false` bloquea acciones de API aunque el usuario tenga sesion valida.
- Endpoints sin autenticacion devuelven `401`, no listas vacias.
- Acciones fuera de rol devuelven `403`.
- Cada endpoint financiero agrega auditoria.
- Webhooks validan firma o secreto antes de tocar datos.

---

## Testing

### Unit Tests

- Calculos de cuota fija.
- Calculos de solo interes.
- Calculos sobre saldo.
- Generacion de cronograma excluyendo fines de semana.
- Calculo de mora porcentaje y monto fijo.
- Formato de comprobante WhatsApp.

### Integration Tests

- Crear prestamo genera prestamo, saldos y cronograma atomico.
- Registrar pago completo actualiza cuota, pago, saldo y auditoria.
- Pago parcial deja saldo pendiente correcto.
- Liquidacion total salda prestamo.
- Refinanciamiento cambia estado anterior y crea nuevo prestamo.
- Job de mora marca cuotas vencidas y crea registros.
- Cierre de ruta calcula efectivo y diferencias.

### Security Tests

- Admin A no ve datos de B.
- Cobrador A1 no ve ruta de A2.
- Cobrador no crea prestamo.
- Usuario inactivo recibe `403`.
- Endpoint sin sesion recibe `401`.
- Super admin ve todos los tenants.
- Webhook con firma invalida recibe `401`.

### Production Checks

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- Supabase advisors security/performance sin hallazgos criticos.

---

## Fases De Implementacion

### Fase 1: Core Operativo

- Configuracion tenant.
- CRUD clientes.
- CRUD cobradores.
- Crear prestamo cuota fija.
- Generar cronograma.
- Ruta diaria.
- Registrar pago completo/parcial.
- Comprobante WhatsApp.
- Auditoria base.

### Fase 2: Operacion Completa

- Solo interes.
- Sobre saldo.
- Mora automatica.
- Refinanciamiento.
- Liquidacion total.
- Caja diaria y cierre de ruta/general.
- Visitas sin pago.

### Fase 3: Inteligencia

- Reportes completos.
- Exportacion Excel/PDF inicial.
- Score de pago.
- Geolocalizacion en pagos/visitas.
- Panel super admin v1 backend.

### Fase 4: SaaS Completo

- Planes.
- Suscripciones.
- Pagos de suscripcion/webhooks.
- Emails Resend.
- Storage de logos/documentos.
- Gestion avanzada de tenants.

### Fase 5: Hardening Produccion

- Tests e2e criticos de API.
- Performance en consultas calientes.
- Advisors Supabase.
- Documentacion OpenAPI/README backend.
- Checklist de deploy.

---

## No Alcance

- UI, componentes visuales y flujos de pantalla.
- App offline con cola local en cliente; el backend devolvera errores/reintentos claros, pero la cola offline vive en frontend.
- Integracion real obligatoria con WhatsApp Business API; v1 usa links `wa.me`.
- Contabilidad avanzada fuera de cierres de caja y reportes del SRS.

---

## Riesgos Y Decisiones

- El SRS completo es grande; se implementara por fases verticales para mantener verificabilidad.
- Los endpoints REST son el contrato principal porque el usuario eligio API Routes REST.
- Para dinero, se preferiran transacciones RPC antes que multiples llamadas desde route handlers.
- Las tablas existentes pueden necesitar migraciones compatibles para agregar columnas financieras (`monto_capital`, `monto_interes`, `saldo_estimado`, `estado cuota cancelado`).
- Pagos SaaS de produccion iniciaran con provider `manual` para activar/suspender tenants desde Super Admin sin depender de credenciales externas.
- La tabla y webhook quedan preparados para `wompi` y `stripe`, pero esos providers no bloquean el cierre del backend productivo inicial.
