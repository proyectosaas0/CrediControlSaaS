# Conectar acciones pendientes a datos reales — Diseño

**Fecha:** 2026-08-12
**Autor:** Juan David Aguilar + Claude

## Problema

Cuatro (en realidad cinco) acciones de la app le muestran al usuario resultados
falsos: renderizan datos mock o simulan éxito con un `toast` sin tocar la base de
datos. Los endpoints reales ya existen y funcionan; lo único que falta es cablear
el frontend.

### Bugs concretos

1. **Dashboard del cobrador con datos inventados.**
   `components/domain/cobrador-dashboard.tsx` importa `MOCK_DAILY_SUMMARY` y
   `MOCK_PAGOS_HOY` de `lib/mock/ruta.ts`. Todo cobrador que entra a la pantalla
   principal (`app/app/page.tsx` renderiza este componente para el rol `cobrador`)
   ve cifras ficticias en vez de su resumen real del día.

2. **"Condonar mora" no persiste.**
   `app/app/mora/page.tsx` (`CondonarMoraButton`) hace `console.log` + `toast` de
   éxito, nunca llama a `POST /api/mora/[id]/condonar`. Además el endpoint hoy
   descarta el motivo de condonación: no lo guarda en ningún lado.

3. **"Pagar mora" no persiste** (bug extra, mismo patrón).
   `app/app/mora/page.tsx` (`PagarMoraButton`) también hace solo `toast`, nunca
   llama a `POST /api/mora/[id]/pago` (que ya existe y funciona).

4. **"Refinanciar préstamo" no conectado.**
   `app/app/prestamos/[id]/page.tsx` (`RefinanciarButton`) solo cierra el modal y
   avisa "pendiente de integración". El endpoint
   `POST /api/prestamos/[id]/refinanciar` ya existe y crea el préstamo nuevo, pero
   nadie lo llama; además ese endpoint pierde el `dia_cobro` del préstamo original.

### Problema transversal de permisos

Los botones "Pagar" y "Condonar" en la página de mora hoy los ve cualquier rol,
pero las APIs solo aceptan `admin`/`super_admin`. Una vez conectados de verdad, un
cobrador recibiría un 403. Decisión: **ocultar esos dos botones para el rol
`cobrador`**, coherente con lo que ya exige el backend.

## Alcance

Este spec cubre **solo** los cuatro/cinco cableados anteriores. El rediseño
móvil de "Nuevo préstamo" queda para un spec aparte.

## Arquitectura

No se crean endpoints nuevos. Los cambios son:

- **Frontend:** reemplazar mocks/simulaciones por hooks de React Query y `fetch`
  reales que ya usa el resto de la app, con invalidación de queries e integración
  con `toast` de error.
- **Backend:** un solo cambio pequeño al endpoint de condonar (aceptar y guardar
  `motivo`), y arreglar que refinanciar copie el `dia_cobro`.
- **Base de datos:** una migración que agrega columnas de auditoría de condonación
  a `mora_registros`, siguiendo el patrón ya establecido en `pagos.anulado_at` /
  `pagos.anulado_por`.

### Hooks y endpoints existentes que se reutilizan

| Necesidad | Ya existe |
|---|---|
| Resumen del día del cobrador | `useRutaHoy()` en `hooks/queries/use-ruta.ts` — la API `GET /api/ruta/hoy` ya filtra por `cobrador_id = auth.uid()` cuando el rol es cobrador |
| Últimos pagos del cobrador | `usePagos()` en `hooks/queries/use-pagos.ts` — la API `GET /api/pagos` ya filtra por `cobrador_id` cuando el rol es cobrador y excluye anulados |
| Rol del usuario en cliente | `useAuth().role` de `providers/auth-provider` (ya usado en `components/layout/header.tsx`) |
| Pagar mora | `POST /api/mora/[id]/pago` `{ monto }` |
| Condonar mora | `POST /api/mora/[id]/condonar` (se le agrega `{ motivo }`) |
| Refinanciar | `POST /api/prestamos/[id]/refinanciar` `{ capital, modeloInteres, tasaMensual, plazoDias, fechaInicio, excluirSabados, excluirDomingos }` |
| Schema de condiciones de préstamo | `prestamoStep2Schema` en `lib/schemas/admin.ts` |

## Componentes / cambios detallados

### 1. Dashboard del cobrador (`components/domain/cobrador-dashboard.tsx`)

Reemplazar los mocks:

- Resumen del día: derivar de `useRutaHoy()`.
  - `cobrosPendientes` = items con estado `pendiente | parcial | mora`.
  - `totalEsperado` = suma de `monto_esperado` de todos los items del día.
  - `totalRecaudado` = suma de `monto_pagado` de todos los items del día.
  - `cumplimiento` = `totalRecaudado / totalEsperado` (con guardas contra división
    por cero).
- Últimos pagos: `usePagos()` recortado a los 3 más recientes. La API ya devuelve
  `clientes.nombre`, `monto`, `medio_pago`, `created_at`. Formatear la fecha con
  `toLocaleString("es-CO")` y mostrar el medio de pago como badge.
- Manejar estados de carga (skeleton) y vacío ("No tienes cobros para hoy" /
  "Sin pagos registrados aún").

Tras esto, eliminar de `lib/mock/ruta.ts` los símbolos que quedan sin uso:
`MOCK_DAILY_SUMMARY`, `MOCK_PAGOS_HOY`, `MOCK_ROUTE_ITEMS`, `MOCK_NEGOCIO`,
`MOCK_COBRADOR`, y los tipos `DailySummary` y `PagoRecord`. **Conservar**
`RouteItem` y `RouteItemStatus` (los usan `route-card.tsx`, `payment-sheet.tsx`,
`app/app/ruta/page.tsx`).

### 2. Migración: auditoría de condonación de mora

Nueva migración `supabase/migrations/20260812_mora_condonacion_audit.sql`:

```sql
alter table public.mora_registros
  add column if not exists motivo_condonacion text,
  add column if not exists condonado_por uuid references public.profiles(id),
  add column if not exists condonado_at timestamptz;
```

Regenerar los tipos de `mora_registros` en `lib/database.types.ts` de forma
quirúrgica (solo las líneas nuevas en Row/Insert/Update), no reescritura total.

### 3. Endpoint condonar (`app/api/mora/[id]/condonar/route.ts`)

- Aceptar body `{ motivo: string }` validado con zod (`min(3)`).
- Al hacer el `update`, además de `estado: "condonada"`, guardar
  `motivo_condonacion: motivo`, `condonado_por: actor.userId`,
  `condonado_at: new Date().toISOString()`.

### 4. Página de mora (`app/app/mora/page.tsx`)

- `PagarMoraButton.onSubmit`: `fetch` real a `POST /api/mora/[id]/pago` con
  `{ monto }`; en éxito, `toast.success`, cerrar modal e invalidar el query
  `["mora"]`; en error, `toast.error` con el mensaje del backend.
- `CondonarMoraButton.onSubmit`: `fetch` real a `POST /api/mora/[id]/condonar` con
  `{ motivo }`; misma lógica de éxito/error e invalidación.
- Usar `useQueryClient` para `invalidateQueries({ queryKey: ["mora"] })`.
- Ocultar `PagarMoraButton` y `CondonarMoraButton` cuando `useAuth().role === "cobrador"`
  (el bloque de acciones donde hoy se renderizan junto al botón de WhatsApp). El
  cobrador sigue viendo la info y el botón de WhatsApp.

### 5. Refinanciar

**Endpoint** (`app/api/prestamos/[id]/refinanciar/route.ts`): al insertar el
préstamo nuevo, copiar `dia_cobro: previous.dia_cobro` (hoy se pierde).

**UI** (`app/app/prestamos/[id]/page.tsx`, `RefinanciarButton`): convertir el modal
en un formulario corto con `react-hook-form` + `zodResolver(prestamoStep2Schema)`,
precargado con los valores actuales del préstamo (capital, modelo, tasa, plazo,
fecha inicio, excluir sábados/domingos). El componente necesita recibir el objeto
`prestamo` completo (hoy solo recibe `prestamoId`). Al enviar:

- `POST /api/prestamos/[id]/refinanciar` con el payload.
- En éxito: `toast.success`, invalidar `["prestamos"]`, y `router.push` al detalle
  del préstamo nuevo (la respuesta devuelve el préstamo creado con su `id`).
- En error: `toast.error` con el mensaje del backend.

Reutilizar el patrón de `<Dialog footer={...}>` ya establecido en
`edit-prestamo-dialog.tsx` para consistencia visual.

## Manejo de errores

Todos los `fetch` siguen el patrón ya usado en `edit-prestamo-dialog.tsx`:
leer `res.ok`, parsear el body de error (`body.error?.message ?? body.message`),
lanzar/mostrar `toast.error`. Sin fallbacks silenciosos.

## Testing

El proyecto no tiene tests de API para estas rutas (solo `tests/domain/mora.test.ts`
de lógica pura). No se inventa un harness nuevo para esto. Verificación:

- `npx tsc --noEmit` limpio.
- `npx eslint` limpio en los archivos tocados.
- Verificación manual de cada flujo contra datos reales vía consultas SQL directas
  (confirmar que condonar/pagar/refinanciar persisten y que el dashboard del
  cobrador refleja su ruta real).

## Fuera de alcance

- Rediseño móvil de "Nuevo préstamo" (spec aparte).
- Backfill de `cronograma_pagos` históricos con capital/interés viejos.
- Arreglar el CI de Tests en rojo (falta de secrets de Supabase) y el workflow
  `deploy.yml` roto.
