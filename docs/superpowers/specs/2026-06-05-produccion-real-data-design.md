# CrédiControl — Producción: datos reales + checklist completo

**Fecha:** 2026-06-05  
**Estado:** Aprobado  
**Objetivo:** Reemplazar todos los datos mock con datos reales de Supabase y dejar la app lista para deploy en Vercel.

---

## Contexto

La app tiene APIs completas en `app/api/**` que consultan Supabase correctamente. El problema es que las páginas del frontend importan datos desde `lib/mock/` en lugar de llamar a esas APIs. Adicionalmente hay 3 APIs que necesitan corrección y varios bloqueos de build que impiden el deploy.

**Stack:** Next.js 16.2.7, React 19, Supabase SSR, @tanstack/react-query v5, Tailwind CSS, TypeScript.

---

## Arquitectura

```
Supabase DB
    ↓
app/api/**         (Route Handlers — ya existen, con algunos fixes)
    ↓
hooks/queries/     (React Query hooks tipados — NUEVO)
    ↓
app/app/**/page    (Páginas — reemplazar mock imports por hooks)
```

---

## Parte 1: Correcciones de API

### 1.1 Reescribir `/api/cobradores`
- **Problema:** Siempre devuelve array mock hardcodeado. Tiene un TODO que dice "cuando se cree la tabla cobradores".
- **Solución:** Los cobradores son `profiles WHERE rol = 'cobrador'`. Consultar `profiles` con filtro `organization_id` del actor.
- **Campos a retornar:** `id`, `nombre` (de profiles), `email` (join con auth.users via admin client), `activo`, `rol`.

### 1.2 Crear `/api/reportes/recaudo-diario`
- **Problema:** La página de Reportes muestra gráfico de barras con recaudo por día. No existe endpoint.
- **Solución:** `GET /api/reportes/recaudo-diario?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
- **Query:** `pagos` agrupados por `date(created_at)`, sumando `monto`. También retorna `esperado` por día desde `cronograma_pagos`.
- **Acceso:** solo `admin` y `super_admin`.

### 1.3 Remover mock fallbacks de dev
- **Archivos:** `app/api/clientes/route.ts`, `app/api/prestamos/route.ts`
- **Cambio:** Eliminar bloque `if (response && process.env.NODE_ENV !== "production")` y las constantes `MOCK_*` locales.

---

## Parte 2: Hooks React Query (`hooks/queries/`)

Cada archivo exporta hooks usando `useQuery` de `@tanstack/react-query`. El `queryKey` sigue el patrón `["recurso", params]`.

| Archivo | Hooks | Endpoint |
|---|---|---|
| `use-clientes.ts` | `useClientes(params?)`, `useCliente(id)` | `GET /api/clientes`, `GET /api/clientes/[id]` |
| `use-prestamos.ts` | `usePrestamos(params?)`, `usePrestamo(id)` | `GET /api/prestamos`, `GET /api/prestamos/[id]` |
| `use-cobradores.ts` | `useCobradores(params?)` | `GET /api/cobradores` |
| `use-mora.ts` | `useMoraList(params?)` | `GET /api/mora` |
| `use-ruta.ts` | `useRutaHoy(fecha?)` | `GET /api/ruta/hoy` |
| `use-reportes.ts` | `useReportesResumen(rango?)`, `useReportesCobradores(rango?)`, `useCarteraRiesgo()`, `useProyeccion(dias?)`, `useRecaudoDiario(rango?)` | `GET /api/reportes/*` |
| `use-caja.ts` | `useCajaResumen(fecha?)` | `GET /api/caja/resumen` |
| `use-super-admin.ts` | `useSuperAdminMetricas()`, `useTenants()` | `GET /api/super-admin/*` |
| `use-auth-me.ts` | `useAuthMe()` | `GET /api/auth/me` |

**Patrón estándar por hook:**
```ts
export function useClientes(params?: { search?: string; activo?: boolean }) {
  return useQuery({
    queryKey: ["clientes", params],
    queryFn: () => fetchApi<ClientesResponse>("/api/clientes", params),
  });
}
```

Se crea un helper `fetchApi<T>(path, params?)` en `hooks/queries/fetch-api.ts` que maneja la URL construction y el error handling uniformemente.

---

## Parte 3: Migración de páginas (15 páginas)

Patrón de migración por página:
1. Eliminar `import { MOCK_* } from "@/lib/mock/..."` 
2. Agregar hook correspondiente
3. Agregar `if (isLoading)` → skeleton o spinner
4. Agregar `if (error)` → mensaje de error
5. Reemplazar referencias `MOCK_*` con `data`

**Páginas y sus hooks:**

| Página | Mock eliminado | Hook(s) a usar |
|---|---|---|
| `app/app/page.tsx` | MOCK_DAILY_SUMMARY, MOCK_PRESTAMOS, MOCK_CLIENTES, MOCK_COBRADORES | `useReportesResumen()`, `usePrestamos({ limit: 3 })` |
| `app/app/layout.tsx` | MOCK_ROUTE_ITEMS | `useRutaHoy()` |
| `app/app/ruta/page.tsx` | MOCK_ROUTE_ITEMS | `useRutaHoy(fecha)` |
| `app/app/mora/page.tsx` | MOCK_MORA, MOCK_CLIENTES | `useMoraList()` |
| `app/app/reportes/page.tsx` | MOCK_RECAUDO_DIARIO, MOCK_COBRADOR_RENDIMIENTO, MOCK_MEDIO_PAGO_DISTRIBUCION, MOCK_CARTERA_RIESGO, MOCK_RESUMEN_METRICAS, MOCK_PROYECCION, MOCK_COBRADORES | `useReportesResumen()`, `useRecaudoDiario()`, `useReportesCobradores()`, `useCarteraRiesgo()`, `useProyeccion()`, `useCobradores()` |
| `app/app/caja/page.tsx` | MOCK_CAJA | `useCajaResumen(fecha)` |
| `app/app/configuracion/page.tsx` | MOCK_TENANT_SETTINGS | `useAuthMe()` (mostrar datos org del usuario) |
| `app/app/clientes/[id]/page.tsx` | MOCK_CLIENTES | `useCliente(id)` |
| `app/app/perfil/page.tsx` | MOCK_* | `useAuthMe()` |
| `app/app/prestamos/[id]/page.tsx` | MOCK_PRESTAMOS | `usePrestamo(id)` |
| `app/app/prestamos/nuevo/page.tsx` | MOCK_CLIENTES, MOCK_COBRADORES | `useClientes()`, `useCobradores()` |
| `app/(super-admin)/dashboard/page.tsx` | MOCK_SUPER_ADMIN | `useSuperAdminMetricas()`, `useTenants()` |
| `app/(super-admin)/metricas/page.tsx` | MOCK_METRICAS | `useSuperAdminMetricas()` |
| `app/(super-admin)/suscripciones/page.tsx` | MOCK_TENANTS | `useTenants()` |
| `app/(super-admin)/tenants/page.tsx` | MOCK_TENANTS | `useTenants()` |

---

## Parte 4: Correcciones de build

### 4.1 TypeScript — `app/api/pagos/route.ts:84`
```ts
// Antes (error)
p_lat: input.lat ?? null,
p_lng: input.lng ?? null,

// Después
p_lat: input.lat ?? undefined,
p_lng: input.lng ?? undefined,
```

### 4.2 CSP headers
- **Problema:** `addSecurityHeaders()` incluye `unsafe-inline` y `unsafe-eval`. Test falla.
- **Solución:** Mover la configuración de headers de seguridad a `next.config.ts` usando la API `headers()`. Eliminar `unsafe-inline` y `unsafe-eval`. Next.js 16 genera nonces automáticamente para scripts inline necesarios.
- **Archivo:** `lib/api/security.ts` → `next.config.ts`

### 4.3 Middleware → proxy
- **Problema:** Next.js 16 deprecó `middleware.ts`, espera `proxy.ts`.
- **Solución:** Renombrar `middleware.ts` → `proxy.ts`. La lógica interna no cambia.

### 4.4 Redis y Sentry opcionales
- Verificar que el código de rate limiting tenga `try/catch` o chequeo de env vars antes de inicializar los clientes.
- Si `UPSTASH_REDIS_REST_URL` no está definido → skip rate limiting (no crash).
- Si `NEXT_PUBLIC_SENTRY_DSN` no está definido → Sentry SDK no inicializa (ya tiene este comportamiento por defecto).

---

## Parte 5: Deploy a Vercel

### 5.1 Variables de entorno requeridas (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://aamfmqhhmuwnyqdsqklr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_APP_URL=https://<proyecto>.vercel.app
NODE_ENV=production
```

### 5.2 Pasos de deploy
1. `npm run build` debe pasar sin errores
2. `npm test` debe pasar (todos los tests)
3. Crear proyecto en Vercel → conectar repo GitHub
4. Configurar env vars
5. Trigger deploy desde main branch

### 5.3 Acciones manuales en Supabase Dashboard (post-deploy)
1. **Auth → Hooks**: Habilitar Custom Access Token Hook (`public.custom_access_token_hook`)
2. **Auth → Password Security**: Habilitar Leaked Password Protection
3. Invalidar sesiones existentes si se cambian passwords seed

---

## Parte 6: Checklist de producción completa (Approach C)

### Tests
- [ ] `npm test` — todos pasan
- [ ] `npm run lint` — sin warnings
- [ ] `npx tsc --noEmit` — sin errores
- [ ] `npm run build` — build exitoso

### Seguridad
- [ ] CSP sin `unsafe-inline` / `unsafe-eval`
- [ ] Custom Access Token Hook habilitado
- [ ] Leaked Password Protection habilitada
- [ ] Passwords seed rotados (cambiar `Password123!`)
- [ ] Service role key solo en env vars del servidor

### Performance
- [ ] Índices DB ya creados (hecho en sprint anterior)
- [ ] RLS activo en todas las tablas (hecho)
- [ ] Connection pooling Supabase en Transaction mode

### Operaciones
- [ ] Health endpoint `/api/health` responde 200
- [ ] Readiness endpoint `/api/ready` responde 200
- [ ] Backups automáticos habilitados en Supabase

---

## Archivos a crear/modificar

**Crear:**
- `hooks/queries/fetch-api.ts`
- `hooks/queries/use-clientes.ts`
- `hooks/queries/use-prestamos.ts`
- `hooks/queries/use-cobradores.ts`
- `hooks/queries/use-mora.ts`
- `hooks/queries/use-ruta.ts`
- `hooks/queries/use-reportes.ts`
- `hooks/queries/use-caja.ts`
- `hooks/queries/use-super-admin.ts`
- `hooks/queries/use-auth-me.ts`
- `app/api/reportes/recaudo-diario/route.ts`

**Modificar:**
- `app/api/cobradores/route.ts` (reescribir)
- `app/api/clientes/route.ts` (remover mock fallback)
- `app/api/prestamos/route.ts` (remover mock fallback)
- `app/api/pagos/route.ts` (fix TypeScript null → undefined)
- `lib/api/security.ts` (remover unsafe-inline/eval del CSP)
- `next.config.ts` (agregar security headers)
- `middleware.ts` → `proxy.ts` (renombrar)
- 15 páginas (remover mock imports, agregar hooks)

**Eliminar (o mantener solo como tipos):**
- `lib/mock/` — los archivos pueden quedar si sus tipos se usan en otro lado, pero no deben ser importados por páginas.
