# CrédiControl — Producción: datos reales + checklist completo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar los 100+ usos de datos mock con llamadas reales a las APIs de Supabase y dejar la app lista para deploy en Vercel.

**Architecture:** React Query hooks tipados en `hooks/queries/` consumen los Route Handlers en `app/api/`. Las páginas eliminan sus imports de `lib/mock/` y usan los hooks. Antes del deploy se corrigen 4 bugs de build y se hacen 5 correcciones de API.

**Tech Stack:** Next.js 16.2.7, React 19, @tanstack/react-query v5, Supabase SSR, TypeScript, Vitest, Vercel.

---

## File Map

**Modificar (API fixes):**
- `app/api/pagos/route.ts` — fix TypeScript null→undefined
- `lib/api/security.ts` — remover unsafe-inline/unsafe-eval del CSP
- `middleware.ts` → `proxy.ts` — rename por convención Next.js 16
- `lib/api/rate-limit.ts` — hacer Redis opcional con fallback graceful
- `app/api/cobradores/route.ts` — reescribir con datos reales de profiles
- `app/api/prestamos/route.ts` — agregar join clientes + remover mock fallback
- `app/api/mora/route.ts` — agregar join prestamos+clientes
- `app/api/ruta/hoy/route.ts` — agregar join clientes
- `app/api/clientes/route.ts` — remover mock fallback de dev

**Crear (API):**
- `app/api/reportes/recaudo-diario/route.ts`

**Crear (hooks):**
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

**Modificar (páginas — 15 archivos):**
- `app/app/page.tsx`
- `app/app/layout.tsx`
- `app/app/ruta/page.tsx`
- `app/app/mora/page.tsx`
- `app/app/reportes/page.tsx`
- `app/app/caja/page.tsx`
- `app/app/configuracion/page.tsx`
- `app/app/perfil/page.tsx`
- `app/app/clientes/[id]/page.tsx`
- `app/app/prestamos/[id]/page.tsx`
- `app/app/prestamos/nuevo/page.tsx`
- `app/(super-admin)/dashboard/page.tsx`
- `app/(super-admin)/metricas/page.tsx`
- `app/(super-admin)/suscripciones/page.tsx`
- `app/(super-admin)/tenants/page.tsx`

---

## Task 1: Fix TypeScript build error en pagos/route.ts

**Files:**
- Modify: `app/api/pagos/route.ts:84-85`

- [ ] **Step 1: Cambiar null → undefined en parámetros lat/lng**

En `app/api/pagos/route.ts` líneas 84-85, cambiar:
```ts
          p_lat: input.lat ?? null,
          p_lng: input.lng ?? null,
```
Por:
```ts
          p_lat: input.lat ?? undefined,
          p_lng: input.lng ?? undefined,
```

- [ ] **Step 2: Verificar que el build pasa**

```bash
npx tsc --noEmit 2>&1 | grep -v "routes.d.ts"
```
Resultado esperado: sin errores en `app/api/pagos/route.ts`

- [ ] **Step 3: Commit**

```bash
git add app/api/pagos/route.ts
git commit -m "fix: corregir tipo null→undefined en parámetros lat/lng de pagos"
```

---

## Task 2: Fix CSP headers (test de seguridad fallando)

**Files:**
- Modify: `lib/api/security.ts`
- Test: `tests/unit/security.test.ts`

- [ ] **Step 1: Actualizar addSecurityHeaders para eliminar unsafe-inline y unsafe-eval**

Reemplazar el bloque CSP en `lib/api/security.ts`:
```ts
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  ].join("; ");
```
Por:
```ts
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
  ].join("; ");
```

- [ ] **Step 2: Correr el test de seguridad**

```bash
npm test -- tests/unit/security.test.ts
```
Resultado esperado: `Tests  N passed` sin failures.

- [ ] **Step 3: Commit**

```bash
git add lib/api/security.ts
git commit -m "fix: remover unsafe-inline y unsafe-eval del CSP para pasar test de seguridad"
```

---

## Task 3: Renombrar middleware.ts → proxy.ts (convención Next.js 16)

**Files:**
- Delete: `middleware.ts`
- Create: `proxy.ts`

- [ ] **Step 1: Crear proxy.ts con el contenido de middleware.ts**

Crear `/home/juanda/cobradiario/proxy.ts` con exactamente el mismo contenido que `middleware.ts` actual:
```ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { addSecurityHeaders, getCorsHeaders } from "@/lib/api/security";

const PUBLIC_PREFIXES = ["/login", "/register", "/verify", "/_next", "/favicon.ico", "/api"];

export async function proxy(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") || undefined;
    const corsHeaders = getCorsHeaders(origin);
    const response = new NextResponse(null, {
      status: 204,
    });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const { response, user } = await updateSession(request);

  // Add security headers
  addSecurityHeaders(response);

  // Add CORS headers to all responses
  const origin = request.headers.get("origin") || undefined;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    if (value) response.headers.set(key, value);
  });

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));
  const isRoot = path === "/";

  if (!user && !isPublic && !isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user) {
    if (path === "/login" || path === "/register" || path === "/verify") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      url.searchParams.delete("redirect");
      return NextResponse.redirect(url);
    }

    if (isRoot) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

Nota: la función se llama `proxy` (no `middleware`) siguiendo la convención de Next.js 16.

- [ ] **Step 2: Eliminar middleware.ts**

```bash
rm /home/juanda/cobradiario/middleware.ts
```

- [ ] **Step 3: Verificar que el build no tiene la advertencia de deprecación**

```bash
npm run build 2>&1 | grep -i "deprecated\|middleware\|proxy"
```
Resultado esperado: sin advertencia `"middleware" file convention is deprecated`.

- [ ] **Step 4: Commit**

```bash
git add proxy.ts
git rm middleware.ts
git commit -m "fix: renombrar middleware.ts → proxy.ts (convención Next.js 16)"
```

---

## Task 4: Hacer Redis opcional (fallback graceful cuando no hay env vars)

**Files:**
- Modify: `lib/api/rate-limit.ts`

- [ ] **Step 1: Reescribir rate-limit.ts con inicialización condicional**

Reemplazar todo el contenido de `lib/api/rate-limit.ts`:
```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

function createLimiter(limiter: Ratelimit["limiter"]): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter, analytics: true });
}

export const globalRateLimit = createLimiter(Ratelimit.slidingWindow(1000, "1 h"));
export const authRateLimit = createLimiter(Ratelimit.slidingWindow(5, "15 m"));
export const apiRateLimit = createLimiter(Ratelimit.slidingWindow(100, "1 m"));

export async function checkRateLimit(
  key: string,
  limiter: Ratelimit | null,
): Promise<{ allowed: boolean; remaining: number; resetAfter: number }> {
  if (!limiter) return { allowed: true, remaining: -1, resetAfter: -1 };
  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAfter: result.reset,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { allowed: true, remaining: -1, resetAfter: -1 };
  }
}
```

- [ ] **Step 2: Verificar que los archivos que usan checkRateLimit siguen compilando**

```bash
npx tsc --noEmit 2>&1 | grep "rate-limit"
```
Resultado esperado: sin errores relacionados con rate-limit.

- [ ] **Step 3: Commit**

```bash
git add lib/api/rate-limit.ts
git commit -m "fix: hacer Redis opcional — app funciona sin UPSTASH env vars"
```

---

## Task 5: Reescribir /api/cobradores con datos reales de profiles

**Files:**
- Modify: `app/api/cobradores/route.ts`

Los cobradores no tienen tabla propia; son `profiles` con `rol = 'cobrador'` dentro de la misma `organization_id` del actor.

- [ ] **Step 1: Reemplazar todo el contenido de app/api/cobradores/route.ts**

```ts
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();
  const activo = url.searchParams.get("activo");

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, nombre_completo, telefono, activo, rol")
    .eq("rol", "cobrador");

  if (actor!.organizationId) {
    query = query.eq("organization_id", actor!.organizationId);
  }

  if (activo === "true") query = query.eq("activo", true);
  if (activo === "false") query = query.eq("activo", false);
  if (search) {
    query = query.ilike("nombre_completo", `%${search}%`);
  }

  const { data, error } = await query.order("nombre_completo", { ascending: true });
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  return apiOk(data ?? []);
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep "cobradores"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/cobradores/route.ts
git commit -m "feat: reescribir /api/cobradores con datos reales desde profiles"
```

---

## Task 6: Actualizar /api/prestamos — join con clientes, remover mock fallback

**Files:**
- Modify: `app/api/prestamos/route.ts`

La página de dashboard necesita `clientes.nombre` en cada préstamo. El endpoint debe incluir ese join.

- [ ] **Step 1: Actualizar el GET handler en app/api/prestamos/route.ts**

Reemplazar el bloque completo de `export async function GET`:
```ts
export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const url = new URL(request.url);
  const { page, pageSize } = paginationParams(url.searchParams);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const estado = url.searchParams.get("estado");

  const supabase = await createClient();
  let query = supabase
    .from("prestamos")
    .select(
      "id, organization_id, cliente_id, cobrador_id, estado, capital, cuota_diaria, total_pagar, plazo_dias, modelo_interes, tasa_mensual, fecha_inicio, fecha_fin, created_at, clientes(nombre), prestamo_saldos(*)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  if (actor!.role === "cobrador") query = query.eq("cobrador_id", actor!.userId);
  if (estado) query = query.eq("estado", estado);

  const { data, error, count } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  return apiOk(data ?? [], { total: count ?? 0, page, pageSize });
}
```

También eliminar la constante `MOCK_PRESTAMOS` y el bloque `if (response && process.env.NODE_ENV !== "production")` al inicio del GET.

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "prestamos/route"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/prestamos/route.ts
git commit -m "feat: agregar join clientes en /api/prestamos y remover mock fallback"
```

---

## Task 7: Actualizar /api/mora — join con prestamos y clientes

**Files:**
- Modify: `app/api/mora/route.ts`

La página de mora necesita nombre y teléfono del cliente, y el capital del préstamo. El endpoint actual solo devuelve `mora_registros.*`.

- [ ] **Step 1: Reemplazar el contenido de app/api/mora/route.ts**

```ts
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const url = new URL(request.url);
  const estado = url.searchParams.get("estado");

  const supabase = await createClient();
  let query = supabase
    .from("mora_registros")
    .select(
      "id, organization_id, prestamo_id, dias_mora, estado, fecha_inicio_mora, monto_mora, monto_pagado_mora, prestamos!inner(capital, cuota_diaria, cliente_id, cobrador_id, clientes!inner(nombre, telefono))"
    )
    .order("dias_mora", { ascending: false });

  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  if (estado === "activa" || estado === "pagada" || estado === "condonada") {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(data ?? []);
}
```

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "mora/route"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/mora/route.ts
git commit -m "feat: agregar join prestamos+clientes en /api/mora"
```

---

## Task 8: Actualizar /api/ruta/hoy — join con clientes

**Files:**
- Modify: `app/api/ruta/hoy/route.ts`

La página de ruta del cobrador necesita `nombre`, `telefono`, `direccion`, `barrio` del cliente para cada cuota.

- [ ] **Step 1: Actualizar el SELECT en app/api/ruta/hoy/route.ts**

Reemplazar la línea del `select` en el query:
```ts
  let query = supabase
    .from("cronograma_pagos")
    .select(
      "id, prestamo_id, organization_id, cobrador_id, fecha_esperada, monto_esperado, monto_pagado, estado, numero_cuota, prestamos!inner(capital, cliente_id, clientes!inner(nombre, telefono, direccion, barrio))"
    )
    .eq("organization_id", actor!.organizationId)
    .eq("fecha_esperada", fecha)
    .order("numero_cuota", { ascending: true });
```

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "ruta/hoy"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/ruta/hoy/route.ts
git commit -m "feat: agregar join clientes en /api/ruta/hoy"
```

---

## Task 9: Crear /api/reportes/recaudo-diario

**Files:**
- Create: `app/api/reportes/recaudo-diario/route.ts`

La página de reportes muestra un gráfico de barras con recaudo por día. Este endpoint agrega `pagos` y `cronograma_pagos` por fecha para un rango dado.

- [ ] **Step 1: Crear el directorio y el route handler**

Crear `app/api/reportes/recaudo-diario/route.ts`:
```ts
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const today = new Date().toISOString().slice(0, 10);
  const desde = url.searchParams.get("desde") ?? today;
  const hasta = url.searchParams.get("hasta") ?? today;

  const supabase = await createClient();

  let pagosQ = supabase
    .from("pagos")
    .select("monto, created_at")
    .gte("created_at", `${desde}T00:00:00`)
    .lte("created_at", `${hasta}T23:59:59`);

  let cuotasQ = supabase
    .from("cronograma_pagos")
    .select("monto_esperado, fecha_esperada")
    .gte("fecha_esperada", desde)
    .lte("fecha_esperada", hasta);

  if (actor!.organizationId) {
    pagosQ = pagosQ.eq("organization_id", actor!.organizationId);
    cuotasQ = cuotasQ.eq("organization_id", actor!.organizationId);
  }

  const [{ data: pagos, error: pagosError }, { data: cuotas, error: cuotasError }] =
    await Promise.all([pagosQ, cuotasQ]);

  if (pagosError) return apiError("INTERNAL_ERROR", pagosError.message, 500);
  if (cuotasError) return apiError("INTERNAL_ERROR", cuotasError.message, 500);

  // Aggregate by date
  const recaudadoByDate = new Map<string, number>();
  for (const p of pagos ?? []) {
    const fecha = p.created_at.slice(0, 10);
    recaudadoByDate.set(fecha, (recaudadoByDate.get(fecha) ?? 0) + p.monto);
  }

  const esperadoByDate = new Map<string, number>();
  for (const c of cuotas ?? []) {
    const fecha = c.fecha_esperada;
    esperadoByDate.set(fecha, (esperadoByDate.get(fecha) ?? 0) + c.monto_esperado);
  }

  // Build result for each day in range
  const result: { fecha: string; recaudado: number; esperado: number }[] = [];
  const current = new Date(desde);
  const end = new Date(hasta);
  while (current <= end) {
    const fecha = current.toISOString().slice(0, 10);
    result.push({
      fecha,
      recaudado: recaudadoByDate.get(fecha) ?? 0,
      esperado: esperadoByDate.get(fecha) ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return apiOk(result, { desde, hasta });
}
```

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "recaudo-diario"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/reportes/recaudo-diario/route.ts
git commit -m "feat: crear /api/reportes/recaudo-diario para gráfico de barras"
```

---

## Task 10: Remover mock fallback de /api/clientes

**Files:**
- Modify: `app/api/clientes/route.ts`

- [ ] **Step 1: Eliminar MOCK_CLIENTES y el if de dev en app/api/clientes/route.ts**

Eliminar estas líneas:
```ts
// Mock data for development/testing without authentication
const MOCK_CLIENTES = [
  { id: "c1", organization_id: "test", nombre: "Cliente 1", ... },
  { id: "c2", organization_id: "test", nombre: "Cliente 2", ... },
];
```

Y dentro del GET, eliminar el bloque:
```ts
  // If not authenticated in development, return mock data
  if (response && process.env.NODE_ENV !== "production") {
    return apiOk(MOCK_CLIENTES);
  }
```

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "clientes/route"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/clientes/route.ts
git commit -m "fix: remover mock fallback de /api/clientes"
```

---

## Task 11: Crear hooks/queries/fetch-api.ts

**Files:**
- Create: `hooks/queries/fetch-api.ts`

Helper compartido por todos los hooks de React Query. Maneja la forma de respuesta `{ data, meta }` y lanza `ApiError` en caso de error.

- [ ] **Step 1: Crear el archivo**

```ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchApi<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN",
      json.error?.message ?? `Error ${res.status}`,
      res.status,
    );
  }
  return json.data as T;
}
```

- [ ] **Step 2: Verificar que TypeScript acepta el archivo**

```bash
npx tsc --noEmit 2>&1 | grep "fetch-api"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add hooks/queries/fetch-api.ts
git commit -m "feat: crear helper fetchApi para hooks de React Query"
```

---

## Task 12: Crear hook use-clientes.ts

**Files:**
- Create: `hooks/queries/use-clientes.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type Cliente = {
  id: string;
  organization_id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  direccion: string | null;
  barrio: string | null;
  notas: string | null;
  score_pago: number;
  activo: boolean;
  created_at: string;
};

type ClientesResponse = Cliente[];

export function useClientes(params?: {
  search?: string;
  activo?: boolean;
  page?: number;
}) {
  return useQuery({
    queryKey: ["clientes", params],
    queryFn: () =>
      fetchApi<ClientesResponse>("/api/clientes", {
        search: params?.search,
        activo: params?.activo,
        page: params?.page,
      }),
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ["clientes", id],
    queryFn: () => fetchApi<Cliente>(`/api/clientes/${id}`),
    enabled: !!id,
  });
}
```

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "use-clientes"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add hooks/queries/use-clientes.ts
git commit -m "feat: hook useClientes y useCliente con React Query"
```

---

## Task 13: Crear hook use-prestamos.ts

**Files:**
- Create: `hooks/queries/use-prestamos.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type Prestamo = {
  id: string;
  organization_id: string;
  cliente_id: string;
  cobrador_id: string | null;
  estado: "activo" | "en_mora" | "saldado" | "refinanciado" | "cancelado";
  capital: number;
  cuota_diaria: number | null;
  total_pagar: number | null;
  plazo_dias: number;
  modelo_interes: "cuota_fija" | "solo_interes" | "sobre_saldo";
  tasa_mensual: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
  clientes: { nombre: string } | null;
  prestamo_saldos: PrestamoSaldo[];
};

export type PrestamoSaldo = {
  id: string;
  prestamo_id: string;
  cuotas_pagadas: number;
  cuotas_totales: number;
  saldo_pendiente: number;
};

type PrestamosResponse = Prestamo[];

export function usePrestamos(params?: {
  estado?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["prestamos", params],
    queryFn: () =>
      fetchApi<PrestamosResponse>("/api/prestamos", {
        estado: params?.estado,
        page: params?.page,
      }),
  });
}

export function usePrestamo(id: string) {
  return useQuery({
    queryKey: ["prestamos", id],
    queryFn: () => fetchApi<Prestamo>(`/api/prestamos/${id}`),
    enabled: !!id,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/queries/use-prestamos.ts
git commit -m "feat: hook usePrestamos y usePrestamo con React Query"
```

---

## Task 14: Crear hook use-cobradores.ts

**Files:**
- Create: `hooks/queries/use-cobradores.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type Cobrador = {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  activo: boolean;
  rol: string;
};

export function useCobradores(params?: { search?: string; activo?: boolean }) {
  return useQuery({
    queryKey: ["cobradores", params],
    queryFn: () =>
      fetchApi<Cobrador[]>("/api/cobradores", {
        search: params?.search,
        activo: params?.activo,
      }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/queries/use-cobradores.ts
git commit -m "feat: hook useCobradores con React Query"
```

---

## Task 15: Crear hook use-mora.ts

**Files:**
- Create: `hooks/queries/use-mora.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type MoraRegistro = {
  id: string;
  organization_id: string;
  prestamo_id: string;
  dias_mora: number | null;
  estado: "activa" | "pagada" | "condonada";
  fecha_inicio_mora: string | null;
  monto_mora: number | null;
  monto_pagado_mora: number;
  prestamos: {
    capital: number;
    cuota_diaria: number | null;
    cliente_id: string;
    cobrador_id: string | null;
    clientes: {
      nombre: string;
      telefono: string | null;
    };
  };
};

export function useMoraList(params?: { estado?: "activa" | "pagada" | "condonada" }) {
  return useQuery({
    queryKey: ["mora", params],
    queryFn: () =>
      fetchApi<MoraRegistro[]>("/api/mora", {
        estado: params?.estado,
      }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/queries/use-mora.ts
git commit -m "feat: hook useMoraList con React Query"
```

---

## Task 16: Crear hook use-ruta.ts

**Files:**
- Create: `hooks/queries/use-ruta.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type CuotaRuta = {
  id: string;
  prestamo_id: string;
  organization_id: string;
  cobrador_id: string | null;
  fecha_esperada: string;
  monto_esperado: number;
  monto_pagado: number;
  estado: "pendiente" | "pagado" | "parcial" | "mora";
  numero_cuota: number;
  prestamos: {
    capital: number;
    cliente_id: string;
    clientes: {
      nombre: string;
      telefono: string | null;
      direccion: string | null;
      barrio: string | null;
    };
  };
};

export function useRutaHoy(fecha?: string) {
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["ruta", fecha ?? today],
    queryFn: () =>
      fetchApi<CuotaRuta[]>("/api/ruta/hoy", {
        fecha: fecha ?? today,
      }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/queries/use-ruta.ts
git commit -m "feat: hook useRutaHoy con React Query"
```

---

## Task 17: Crear hook use-reportes.ts

**Files:**
- Create: `hooks/queries/use-reportes.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type ReportesResumen = {
  desde: string;
  hasta: string;
  prestamosActivos: number;
  prestamosEnMora: number;
  recaudoTotal: number;
};

export type RecaudoDiario = {
  fecha: string;
  recaudado: number;
  esperado: number;
};

export type ReportesCobrador = {
  cobrador_id: string;
  total: number;
};

export type CarteraRiesgo = {
  mayorA3: number;
  mayorA7: number;
  mayorA15: number;
  montoTotal: number;
};

export type Proyeccion = {
  dias: number;
  total: number;
};

type RangoParams = { desde?: string; hasta?: string };

function todayRange(): RangoParams {
  const today = new Date().toISOString().slice(0, 10);
  return { desde: today, hasta: today };
}

export function useReportesResumen(rango?: RangoParams) {
  const { desde, hasta } = rango ?? todayRange();
  return useQuery({
    queryKey: ["reportes", "resumen", desde, hasta],
    queryFn: () =>
      fetchApi<ReportesResumen>("/api/reportes/resumen", { desde, hasta }),
  });
}

export function useRecaudoDiario(rango?: RangoParams) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const desde = rango?.desde ?? sevenDaysAgo.toISOString().slice(0, 10);
  const hasta = rango?.hasta ?? new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["reportes", "recaudo-diario", desde, hasta],
    queryFn: () =>
      fetchApi<RecaudoDiario[]>("/api/reportes/recaudo-diario", { desde, hasta }),
  });
}

export function useReportesCobradores(rango?: RangoParams) {
  const { desde, hasta } = rango ?? todayRange();
  return useQuery({
    queryKey: ["reportes", "cobradores", desde, hasta],
    queryFn: () =>
      fetchApi<ReportesCobrador[]>("/api/reportes/cobradores", { desde, hasta }),
  });
}

export function useCarteraRiesgo() {
  return useQuery({
    queryKey: ["reportes", "cartera-riesgo"],
    queryFn: () => fetchApi<CarteraRiesgo>("/api/reportes/cartera-riesgo"),
  });
}

export function useProyeccion(dias = 30) {
  return useQuery({
    queryKey: ["reportes", "proyeccion", dias],
    queryFn: () => fetchApi<Proyeccion>("/api/reportes/proyeccion", { dias }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/queries/use-reportes.ts
git commit -m "feat: hooks de reportes (resumen, recaudo diario, cobradores, cartera, proyección)"
```

---

## Task 18: Crear hook use-caja.ts

**Files:**
- Create: `hooks/queries/use-caja.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type CajaResumen = {
  fecha: string;
  totalEsperado: number;
  totalRecaudado: number;
  diferencia: number;
};

export function useCajaResumen(fecha?: string) {
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["caja", "resumen", fecha ?? today],
    queryFn: () =>
      fetchApi<CajaResumen>("/api/caja/resumen", {
        fecha: fecha ?? today,
      }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/queries/use-caja.ts
git commit -m "feat: hook useCajaResumen con React Query"
```

---

## Task 19: Crear hooks use-super-admin.ts y use-auth-me.ts

**Files:**
- Create: `hooks/queries/use-super-admin.ts`
- Create: `hooks/queries/use-auth-me.ts`

- [ ] **Step 1: Crear hooks/queries/use-super-admin.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type SuperAdminMetricas = {
  tenants: number;
  prestamos: number;
  pagosRegistrados: number;
};

export type Tenant = {
  id: string;
  nombre_negocio: string;
  ciudad: string | null;
  telefono: string | null;
  plan: string;
  estado_suscripcion: string;
  trial_hasta: string | null;
  created_at: string;
};

export function useSuperAdminMetricas() {
  return useQuery({
    queryKey: ["super-admin", "metricas"],
    queryFn: () => fetchApi<SuperAdminMetricas>("/api/super-admin/metricas"),
  });
}

export function useTenants() {
  return useQuery({
    queryKey: ["super-admin", "tenants"],
    queryFn: () => fetchApi<Tenant[]>("/api/super-admin/tenants"),
  });
}
```

- [ ] **Step 2: Crear hooks/queries/use-auth-me.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type AuthMeResponse = {
  actor: {
    userId: string;
    role: string;
    organizationId: string | null;
  };
  profile: {
    id: string;
    organization_id: string | null;
    nombre_completo: string;
    rol: string;
    telefono: string | null;
    activo: boolean;
    ultimo_acceso: string | null;
  } | null;
  organization: {
    id: string;
    nombre_negocio: string;
    logo_url: string | null;
    ciudad: string | null;
    telefono: string | null;
    plan: string;
    estado_suscripcion: string;
    trial_hasta: string | null;
    created_at: string;
  } | null;
};

export function useAuthMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => fetchApi<AuthMeResponse>("/api/auth/me"),
    staleTime: 60_000,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add hooks/queries/use-super-admin.ts hooks/queries/use-auth-me.ts
git commit -m "feat: hooks useSuperAdminMetricas, useTenants y useAuthMe"
```

---

## Task 20: Migrar app/app/page.tsx (Dashboard admin)

**Files:**
- Modify: `app/app/page.tsx`

Reemplazar `MOCK_DAILY_SUMMARY`, `MOCK_PRESTAMOS`, `MOCK_CLIENTES`, `MOCK_COBRADORES` con `useReportesResumen()` y `usePrestamos()`.

- [ ] **Step 1: Reemplazar todo el contenido de app/app/page.tsx**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { OnboardingTutorial } from "@/components/auth/onboarding-tutorial";
import { CobradorDashboard } from "@/components/domain/cobrador-dashboard";
import { Card } from "@/components/ui/card";
import { formatCop } from "@/lib/domain/money";
import { buttonClasses } from "@/components/ui/button";
import { useReportesResumen } from "@/hooks/queries/use-reportes";
import { usePrestamos } from "@/hooks/queries/use-prestamos";
import { TrendingUp, Users, AlertTriangle, Wallet, ArrowRight } from "lucide-react";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  const userName = user?.email?.split("@")[0] ?? "Usuario";

  if (role === "cobrador") {
    if (showOnboarding) {
      return (
        <div className="mx-auto max-w-md py-4">
          <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />
        </div>
      );
    }
    return <CobradorDashboard userName={userName} />;
  }

  return <AdminDashboard userName={userName} />;
}

function AdminDashboard({ userName }: { userName: string }) {
  const { data: resumen, isLoading: loadingResumen } = useReportesResumen();
  const { data: prestamos, isLoading: loadingPrestamos } = usePrestamos();

  const prestamosActivos = prestamos?.filter((p) => p.estado === "activo").length ?? 0;
  const enMora = prestamos?.filter((p) => p.estado === "en_mora").length ?? 0;
  const recentPrestamos = prestamos?.slice(0, 3) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hola, {userName}</h1>
        <p className="text-sm text-muted-foreground">Resumen de tu cartera</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Wallet className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recaudo hoy</p>
              <p className="text-lg font-bold text-foreground">
                {loadingResumen ? "—" : formatCop(resumen?.recaudoTotal ?? 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prestamos activos</p>
              <p className="text-lg font-bold text-foreground">
                {loadingPrestamos ? "—" : prestamosActivos}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En mora</p>
              <p className="text-lg font-bold text-foreground">
                {loadingPrestamos ? "—" : enMora}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Users className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total prestamos</p>
              <p className="text-lg font-bold text-foreground">
                {loadingPrestamos ? "—" : (prestamos?.length ?? 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/clientes" className={buttonClasses("outline", "sm") + " w-full"}>
          Ver clientes
        </Link>
        <Link href="/app/prestamos" className={buttonClasses("outline", "sm") + " w-full"}>
          Ver prestamos
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Ultimos prestamos</h2>
          <Link
            href="/app/prestamos"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver todos
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {loadingPrestamos && (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          )}
          {recentPrestamos.map((p) => (
            <Link key={p.id} href={`/app/prestamos/${p.id}`}>
              <Card padding="md" className="mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {p.clientes?.nombre ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCop(p.capital)} · {p.modelo_interes.replace("_", " ")}
                    </p>
                  </div>
                  <LoanStatusBadge estado={p.estado} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "app/page"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/app/page.tsx
git commit -m "feat: migrar dashboard a datos reales via useReportesResumen y usePrestamos"
```

---

## Task 21: Migrar app/app/layout.tsx

**Files:**
- Modify: `app/app/layout.tsx`

El layout usa `MOCK_ROUTE_ITEMS` solo para contar pendientes en el `MobileNav`. Con datos reales usa `useRutaHoy()`.

- [ ] **Step 1: Actualizar app/app/layout.tsx**

Reemplazar el contenido completo:
```tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RoleGate } from "@/components/layout/role-gate";
import { useAuth } from "@/providers/auth-provider";
import { useRutaHoy } from "@/hooks/queries/use-ruta";
import type { AppRole } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, user } = useAuth();
  const { data: rutaItems } = useRutaHoy();

  const userName = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  const pendingCount =
    rutaItems?.filter(
      (i) => i.estado === "pendiente" || i.estado === "mora" || i.estado === "parcial",
    ).length ?? 0;

  return (
    <div className="flex h-full">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={(role as AppRole) ?? "admin"}
        userName={userName}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} userName={userName} />

        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>

        <RoleGate allowed={["cobrador"]} role={role}>
          <MobileNav pendingCount={pendingCount} />
        </RoleGate>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/app/layout.tsx
git commit -m "feat: migrar layout — pendingCount desde useRutaHoy"
```

---

## Task 22: Migrar app/app/ruta/page.tsx

**Files:**
- Modify: `app/app/ruta/page.tsx`

La función `CobradorRutaView` usa `MOCK_ROUTE_ITEMS`. Se reemplaza con `useRutaHoy()`. El tipo `RouteItem` del mock tiene campos camelCase; los datos reales usan snake_case — hay que adaptar.

- [ ] **Step 1: Reemplazar CobradorRutaView en app/app/ruta/page.tsx**

Cambiar las primeras líneas del import y la función `CobradorRutaView`:
```tsx
"use client";

import { useState } from "react";
import { RouteCard } from "@/components/domain/route-card";
import { PaymentSheet } from "@/components/domain/payment-sheet";
import { AdminRutaView } from "@/components/domain/admin-ruta-view";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { useRutaHoy, type CuotaRuta } from "@/hooks/queries/use-ruta";
import { type MedioPago } from "@/lib/mock/ruta-types";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatCop } from "@/lib/domain/money";

type FilterType = "todos" | CuotaRuta["estado"];

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "pagado", label: "Pagados" },
  { value: "parcial", label: "Parciales" },
  { value: "mora", label: "En mora" },
];

export default function RutaPage() {
  const { role } = useAuth();
  if (role === "admin" || role === "super_admin") return <AdminRutaView />;
  return <CobradorRutaView />;
}

function CobradorRutaView() {
  const { data: items = [], isLoading } = useRutaHoy();
  const [selectedItem, setSelectedItem] = useState<CuotaRuta | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("todos");

  const filteredItems =
    filter === "todos" ? items : items.filter((i) => i.estado === filter);

  const pendientes = items.filter(
    (i) => i.estado === "pendiente" || i.estado === "mora" || i.estado === "parcial",
  );

  function handleCardClick(item: CuotaRuta) {
    if (item.estado === "pagado") return;
    setSelectedItem(item);
    setSheetOpen(true);
  }

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando ruta...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Mi Ruta</h1>
          <p className="text-sm text-muted-foreground">
            {pendientes.length} cobros pendientes
          </p>
        </div>
        <Badge variant="primary">{items.length} total</Badge>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === opt.value
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-8 w-8" />}
          title="Sin cobros"
          description="No hay cobros para este filtro"
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <RouteCard
              key={item.id}
              item={{
                id: item.id,
                clienteNombre: item.prestamos.clientes.nombre,
                clienteTelefono: item.prestamos.clientes.telefono ?? "",
                barrio: item.prestamos.clientes.barrio ?? "",
                direccion: item.prestamos.clientes.direccion ?? "",
                montoEsperado: item.monto_esperado,
                montoPagado: item.monto_pagado > 0 ? item.monto_pagado : null,
                medioPago: null,
                cuotaNumero: item.numero_cuota,
                cuotaTotal: 0,
                saldoPendiente: item.monto_esperado - item.monto_pagado,
                estado: item.estado as "pendiente" | "pagado" | "parcial" | "mora" | "no_encontrado",
              }}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <PaymentSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          item={{
            id: selectedItem.id,
            clienteNombre: selectedItem.prestamos.clientes.nombre,
            clienteTelefono: selectedItem.prestamos.clientes.telefono ?? "",
            barrio: selectedItem.prestamos.clientes.barrio ?? "",
            direccion: selectedItem.prestamos.clientes.direccion ?? "",
            montoEsperado: selectedItem.monto_esperado,
            montoPagado: selectedItem.monto_pagado > 0 ? selectedItem.monto_pagado : null,
            medioPago: null,
            cuotaNumero: selectedItem.numero_cuota,
            cuotaTotal: 0,
            saldoPendiente: selectedItem.monto_esperado - selectedItem.monto_pagado,
            estado: selectedItem.estado as "pendiente" | "pagado" | "parcial" | "mora" | "no_encontrado",
          }}
          onSuccess={(_id: string, _medioPago: MedioPago, _monto: number) => {
            toast.success("Pago registrado");
            setSheetOpen(false);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "ruta/page"
```
Resultado esperado: sin errores tipables.

- [ ] **Step 3: Commit**

```bash
git add app/app/ruta/page.tsx
git commit -m "feat: migrar ruta page a datos reales via useRutaHoy"
```

---

## Task 23: Migrar app/app/mora/page.tsx

**Files:**
- Modify: `app/app/mora/page.tsx`

- [ ] **Step 1: Actualizar los imports y la lógica de datos en mora/page.tsx**

Reemplazar las primeras líneas de imports y la función `MoraPage`:
```tsx
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Phone, DollarSign, ShieldCheck, Send } from "lucide-react";
import { useMoraList, type MoraRegistro } from "@/hooks/queries/use-mora";
import { formatCop } from "@/lib/domain/money";
import { ScoreBadge } from "@/components/domain/score-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/components/ui/cn";
import { toast } from "sonner";
```

En el cuerpo de `MoraPage`, cambiar:
```tsx
export default function MoraPage() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [filtroDias, setFiltroDias] = useState<FiltroDias>("todos");

  const { data: moraData = [], isLoading } = useMoraList();

  const filtered = useMemo(() => {
    let list = moraData;

    if (filtroEstado !== "todos") list = list.filter((m) => m.estado === filtroEstado);
    if (filtroDias !== "todos") list = list.filter((m) => getDiasFiltro(m.dias_mora ?? 0) === filtroDias);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) => m.prestamos.clientes.nombre.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => (b.dias_mora ?? 0) - (a.dias_mora ?? 0));
  }, [search, filtroEstado, filtroDias, moraData]);

  const resumen = useMemo(() => {
    const activas = moraData.filter((m) => m.estado === "activa");
    const totalMonto = activas.reduce((sum, m) => sum + ((m.monto_mora ?? 0) - m.monto_pagado_mora), 0);
    const avgDias =
      activas.length > 0
        ? Math.round(activas.reduce((sum, m) => sum + (m.dias_mora ?? 0), 0) / activas.length)
        : 0;
    return { clientesEnMora: activas.length, montoTotalMora: totalMonto, promedioDias: avgDias };
  }, [moraData]);
```

En las funciones `MoraCard` y `PagarMoraButton`, cambiar el tipo `MockMora` por `MoraRegistro`, y los campos camelCase por snake_case:
- `mora.clienteNombre` → `mora.prestamos.clientes.nombre`
- `mora.clienteTelefono` → `mora.prestamos.clientes.telefono ?? ""`
- `mora.diasMora` → `mora.dias_mora ?? 0`
- `mora.montoMora` → `mora.monto_mora ?? 0`
- `mora.montoPagadoMora` → `mora.monto_pagado_mora`
- `mora.capital` → `mora.prestamos.capital`
- `mora.cuotaDiaria` → `mora.prestamos.cuota_diaria ?? 0`
- `mora.fechaInicioMora` → `mora.fecha_inicio_mora ?? ""`

Agregar loading state justo antes del return principal:
```tsx
  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando mora...</p>;
  }
```

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "mora/page"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/app/mora/page.tsx
git commit -m "feat: migrar mora page a datos reales via useMoraList"
```

---

## Task 24: Migrar app/app/reportes/page.tsx

**Files:**
- Modify: `app/app/reportes/page.tsx`

- [ ] **Step 1: Actualizar imports en reportes/page.tsx**

Reemplazar el bloque de imports de mock:
```tsx
import {
  useReportesResumen,
  useRecaudoDiario,
  useReportesCobradores,
  useCarteraRiesgo,
  useProyeccion,
} from "@/hooks/queries/use-reportes";
import { useCobradores } from "@/hooks/queries/use-cobradores";
```

- [ ] **Step 2: Actualizar el estado y datos en ReportesPage**

En el cuerpo de `ReportesPage`, agregar los hooks y reemplazar todas las referencias mock:
```tsx
export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [cobradorFiltro, setCobradorFiltro] = useState<string>("todos");
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));

  const rango = { desde, hasta };
  const { data: metricas, isLoading: loadingMetricas } = useReportesResumen(rango);
  const { data: recaudoDiario = [], isLoading: loadingChart } = useRecaudoDiario(rango);
  const { data: cobradoresRendimiento = [] } = useReportesCobradores(rango);
  const { data: cartera } = useCarteraRiesgo();
  const { data: proyeccion } = useProyeccion(30);
  const { data: cobradores = [] } = useCobradores({ activo: true });
```

Reemplazar en el JSX:
- `MOCK_RESUMEN_METRICAS.prestamosActivos` → `metricas?.prestamosActivos ?? 0`
- `MOCK_RESUMEN_METRICAS.recaudoTotal` → `metricas?.recaudoTotal ?? 0`
- `MOCK_RESUMEN_METRICAS.prestamosEnMora` → `metricas?.prestamosEnMora ?? 0`
- `MOCK_RECAUDO_DIARIO` → `recaudoDiario`
- `d.esperado` / `d.recaudado` → `d.esperado` / `d.recaudado` (mismos nombres del nuevo endpoint)
- `MOCK_COBRADOR_RENDIMIENTO` → `cobradoresRendimiento` (campo `cobrador_id` y `total`)
- `MOCK_CARTERA_RIESGO` → `cartera`
- `MOCK_PROYECCION` → `[{ dias: 30, total: proyeccion?.total ?? 0 }]`
- `MOCK_COBRADORES.filter(c => c.activo)` → `cobradores`
- `c.nombre` (mock cobrador) → `c.nombre_completo`

En los botones de export, cambiar el mensaje de "(mock)" a "" o quitar el toast provisional.

- [ ] **Step 3: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "reportes/page"
```
Resultado esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add app/app/reportes/page.tsx
git commit -m "feat: migrar reportes page a datos reales"
```

---

## Task 25: Migrar app/app/caja/page.tsx

**Files:**
- Modify: `app/app/caja/page.tsx`

- [ ] **Step 1: Actualizar caja/page.tsx para usar useCajaResumen**

Reemplazar:
```tsx
import {
  MOCK_CAJA_RESUMEN,
  MOCK_CAJA_COBRADORES,
  MOCK_PAGOS_HOY,
  MOCK_CIERRES_CAJA,
} from "@/lib/mock/caja";
```

Por:
```tsx
import { useCajaResumen } from "@/hooks/queries/use-caja";
```

En el cuerpo de `CajaPage`:
```tsx
export default function CajaPage() {
  const { data: resumen, isLoading } = useCajaResumen();

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando caja...</p>;
  }
```

Reemplazar todas las referencias `resumen.*`:
- `resumen.totalEsperado` → `resumen?.totalEsperado ?? 0`
- `resumen.totalRecaudado` → `resumen?.totalRecaudado ?? 0`
- `resumen.diferencia` → `resumen?.diferencia ?? 0`

Eliminar las secciones del JSX que usan `MOCK_CAJA_COBRADORES`, `MOCK_PAGOS_HOY`, `MOCK_CIERRES_CAJA` — mostrar una card con mensaje "Próximamente" en su lugar o simplemente omitirlas.

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "caja/page"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/app/caja/page.tsx
git commit -m "feat: migrar caja page a datos reales via useCajaResumen"
```

---

## Task 26: Migrar app/app/configuracion/page.tsx

**Files:**
- Modify: `app/app/configuracion/page.tsx`

`MOCK_TENANT_SETTINGS` tiene campos que no existen en la DB (mora config, tasas, horarios). Se usa `useAuthMe()` para poblar solo los campos disponibles en `organization`.

- [ ] **Step 1: Actualizar configuracion/page.tsx**

Reemplazar el import de mock:
```tsx
import { useAuthMe } from "@/hooks/queries/use-auth-me";
```

En el cuerpo de `ConfiguracionPage`:
```tsx
export default function ConfiguracionPage() {
  const { data: me, isLoading } = useAuthMe();
  const org = me?.organization;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    watch,
  } = useForm<ConfiguracionFormData>({
    resolver: zodResolver(configuracionSchema),
    defaultValues: {
      nombreNegocio: org?.nombre_negocio ?? "",
      ciudad: org?.ciudad ?? "",
      telefono: org?.telefono ?? "",
      moraTipo: "porcentaje",
      moraValor: 5,
      diasGracia: 3,
      tasaInteresDefault: 10,
      cobrarSabados: true,
      cobrarDomingos: false,
      geolocalizacionRequerida: false,
      moneda: "COP",
      horarioInicio: "07:00",
      horarioFin: "18:00",
      whatsappTemplate: "Hola {cliente}, tu pago de {monto} ha sido registrado.",
      colorPrimario: "#1d4ed8",
    },
  });
```

Agregar loading state antes del return:
```tsx
  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando configuración...</p>;
  }
```

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "configuracion/page"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/app/configuracion/page.tsx
git commit -m "feat: migrar configuracion page a datos reales via useAuthMe"
```

---

## Task 27: Migrar app/app/perfil/page.tsx

**Files:**
- Modify: `app/app/perfil/page.tsx`

`MOCK_COBRADOR` es solo un string de nombre. Se reemplaza con `profile.nombre_completo` de `useAuthMe()`.

- [ ] **Step 1: Actualizar perfil/page.tsx**

Reemplazar todo el contenido:
```tsx
"use client";

import { useAuth } from "@/providers/auth-provider";
import { useAuthMe } from "@/hooks/queries/use-auth-me";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, LogOut } from "lucide-react";
import { es } from "@/lib/i18n/es";

export default function PerfilPage() {
  const { user, role, signOut } = useAuth();
  const { data: me } = useAuthMe();
  const nombre = me?.profile?.nombre_completo ?? user?.email ?? "Usuario";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Perfil</h1>

      <Card padding="md">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-foreground">{nombre}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email ?? ""}
            </p>
            <Badge variant="primary" className="mt-1">
              {role ?? "cobrador"}
            </Badge>
          </div>
        </div>
      </Card>

      <Button variant="outline" size="lg" className="w-full" onClick={signOut}>
        <LogOut className="h-4 w-4" />
        {es.auth.logout}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/app/perfil/page.tsx
git commit -m "feat: migrar perfil page a datos reales via useAuthMe"
```

---

## Task 28: Migrar app/app/clientes/[id]/page.tsx

**Files:**
- Modify: `app/app/clientes/[id]/page.tsx`

- [ ] **Step 1: Actualizar clientes/[id]/page.tsx**

Reemplazar imports de mock:
```tsx
import { useCliente } from "@/hooks/queries/use-clientes";
import { usePrestamos } from "@/hooks/queries/use-prestamos";
```

En el cuerpo de `ClienteDetailPage`:
```tsx
export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: cliente, isLoading, error } = useCliente(id);
  const { data: todosPrestamos = [] } = usePrestamos();

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando...</p>;
  }

  if (error || !cliente) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-primary underline">
          Volver
        </button>
      </div>
    );
  }

  const prestamos = todosPrestamos.filter((p) => p.cliente_id === cliente.id);
  const totalPrestado = prestamos.reduce((sum, p) => sum + p.capital, 0);
  const prestamosActivos = prestamos.filter((p) => p.estado === "activo" || p.estado === "en_mora");
```

Adaptar el JSX:
- `cliente.nombre` → igual
- `cliente.cedula` → igual
- `cliente.telefono` → igual
- `cliente.direccion` → igual
- `cliente.barrio` → igual
- `prestamo.clienteNombre` → `prestamo.clientes?.nombre ?? "—"` (campo del join)
- `prestamo.estado` → igual
- `prestamo.capital` → igual
- `prestamo.modeloInteres` → `prestamo.modelo_interes`

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "clientes/\[id\]"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add "app/app/clientes/[id]/page.tsx"
git commit -m "feat: migrar detalle de cliente a datos reales"
```

---

## Task 29: Migrar app/app/prestamos/[id]/page.tsx

**Files:**
- Modify: `app/app/prestamos/[id]/page.tsx`

- [ ] **Step 1: Actualizar prestamos/[id]/page.tsx**

Reemplazar import mock y lógica:
```tsx
import { usePrestamo } from "@/hooks/queries/use-prestamos";
```

```tsx
export default function PrestamoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: prestamo, isLoading, error } = usePrestamo(id);

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando...</p>;
  }

  if (error || !prestamo) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Prestamo no encontrado</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-primary underline">
          Volver
        </button>
      </div>
    );
  }
```

Adaptar en el JSX:
- `prestamo.clienteNombre` → `prestamo.clientes?.nombre ?? "—"`
- `prestamo.estado` → igual
- `prestamo.capital` → igual
- `prestamo.modeloInteres` → `prestamo.modelo_interes`
- `prestamo.tasaMensual` → `prestamo.tasa_mensual`
- `prestamo.plazoDias` → `prestamo.plazo_dias`
- `prestamo.fechaInicio` → `prestamo.fecha_inicio`
- `prestamo.totalPagar` → `prestamo.total_pagar`
- `prestamo.cuotaDiaria` → `prestamo.cuota_diaria`

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "prestamos/\[id\]"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add "app/app/prestamos/[id]/page.tsx"
git commit -m "feat: migrar detalle de préstamo a datos reales"
```

---

## Task 30: Migrar app/app/prestamos/nuevo/page.tsx

**Files:**
- Modify: `app/app/prestamos/nuevo/page.tsx`

- [ ] **Step 1: Actualizar prestamos/nuevo/page.tsx**

Reemplazar import mock:
```tsx
import { useClientes } from "@/hooks/queries/use-clientes";
import { useCobradores } from "@/hooks/queries/use-cobradores";
```

En el cuerpo del componente agregar los hooks:
```tsx
  const { data: clientes = [] } = useClientes({ activo: true });
  const { data: cobradores = [] } = useCobradores({ activo: true });
```

Reemplazar en el select de clientes:
- `MOCK_CLIENTES.map(c => ({ value: c.id, label: c.nombre }))` → `clientes.map(c => ({ value: c.id, label: c.nombre }))`

Reemplazar en el select de cobradores:
- `MOCK_COBRADORES.filter(c => c.activo).map(c => ({ value: c.id, label: c.nombre }))` → `cobradores.map(c => ({ value: c.id, label: c.nombre_completo }))`

- [ ] **Step 2: Compilar**

```bash
npx tsc --noEmit 2>&1 | grep "prestamos/nuevo"
```
Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add "app/app/prestamos/nuevo/page.tsx"
git commit -m "feat: migrar formulario nuevo préstamo a datos reales"
```

---

## Task 31: Migrar super-admin pages (4 páginas)

**Files:**
- Modify: `app/(super-admin)/dashboard/page.tsx`
- Modify: `app/(super-admin)/metricas/page.tsx`
- Modify: `app/(super-admin)/suscripciones/page.tsx`
- Modify: `app/(super-admin)/tenants/page.tsx`

Nota: `MOCK_CRECIMIENTO_MENSUAL`, `MOCK_ACTIVIDAD_RECIENTE`, `MOCK_PLANES`, `MOCK_PAGOS_SUSCRIPCION` no tienen endpoints reales. Esas secciones se eliminan y se muestra solo los datos disponibles.

- [ ] **Step 1: Actualizar app/(super-admin)/dashboard/page.tsx**

Reemplazar imports y lógica:
```tsx
"use client";

import { Building2, CreditCard, DollarSign, Activity } from "lucide-react";
import { useSuperAdminMetricas } from "@/hooks/queries/use-super-admin";
import { Card } from "@/components/ui/card";

export default function SuperAdminDashboardPage() {
  const { data: m, isLoading } = useSuperAdminMetricas();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel Super Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion de la plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Tenants</p>
              <p className="text-xl font-bold">{isLoading ? "—" : (m?.tenants ?? 0)}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Prestamos</p>
              <p className="text-xl font-bold">{isLoading ? "—" : (m?.prestamos ?? 0)}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-info" />
            <div>
              <p className="text-xs text-muted-foreground">Pagos</p>
              <p className="text-xl font-bold">{isLoading ? "—" : (m?.pagosRegistrados ?? 0)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Actualizar app/(super-admin)/metricas/page.tsx**

```tsx
"use client";

import { Building2, Activity, DollarSign } from "lucide-react";
import { useSuperAdminMetricas } from "@/hooks/queries/use-super-admin";
import { Card } from "@/components/ui/card";

export default function MetricasPage() {
  const { data: m, isLoading } = useSuperAdminMetricas();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Métricas</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Tenants activos</p>
          <p className="text-2xl font-bold mt-1">{isLoading ? "—" : (m?.tenants ?? 0)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Prestamos</p>
          <p className="text-2xl font-bold mt-1">{isLoading ? "—" : (m?.prestamos ?? 0)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Pagos registrados</p>
          <p className="text-2xl font-bold mt-1">{isLoading ? "—" : (m?.pagosRegistrados ?? 0)}</p>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Actualizar app/(super-admin)/tenants/page.tsx**

Reemplazar import mock:
```tsx
import { useTenants, type Tenant } from "@/hooks/queries/use-super-admin";
```

En el cuerpo, cambiar:
```tsx
  const { data: tenants = [], isLoading } = useTenants();
```

Y en el JSX adaptar los campos del mock al tipo real `Tenant`:
- `t.nombreNegocio` → `t.nombre_negocio`
- `t.estadoSuscripcion` → `t.estado_suscripcion`
- `t.trialHasta` → `t.trial_hasta`
- `t.plan` → `t.plan`
- `t.ciudad` → `t.ciudad`
- `t.telefono` → `t.telefono`

Eliminar cualquier sección que use campos que no existen en `Tenant` (como `cantidadUsuarios`, `cantidadPrestamos`).

- [ ] **Step 4: Actualizar app/(super-admin)/suscripciones/page.tsx**

```tsx
"use client";

import { Building2, CreditCard } from "lucide-react";
import { useTenants } from "@/hooks/queries/use-super-admin";
import { Card } from "@/components/ui/card";

export default function SuscripcionesPage() {
  const { data: tenants = [], isLoading } = useTenants();

  const planCount = tenants.reduce<Record<string, number>>((acc, t) => {
    acc[t.plan] = (acc[t.plan] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Suscripciones</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(planCount).map(([plan, count]) => (
              <Card key={plan} padding="md">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">{plan}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            {tenants.map((t) => (
              <Card key={t.id} padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">{t.nombre_negocio}</p>
                      <p className="text-xs text-muted-foreground">{t.plan} · {t.estado_suscripcion}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Compilar todo**

```bash
npx tsc --noEmit 2>&1 | grep "super-admin"
```
Resultado esperado: sin errores.

- [ ] **Step 6: Commit**

```bash
git add "app/(super-admin)/dashboard/page.tsx" "app/(super-admin)/metricas/page.tsx" "app/(super-admin)/tenants/page.tsx" "app/(super-admin)/suscripciones/page.tsx"
git commit -m "feat: migrar super-admin pages a datos reales"
```

---

## Task 32: Verificar build completo y tests

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Correr todos los tests**

```bash
npm test
```
Resultado esperado: `Tests  N passed` — el test de CSP (anteriormente fallando) debe pasar. El único test que podría seguir fallando es si hay tests que dependen de la forma del mock. Investigar y corregir cualquier fallo.

- [ ] **Step 2: Build de producción completo**

```bash
npm run build
```
Resultado esperado:
```
✓ Compiled successfully
```
Sin errores de TypeScript. La advertencia de middleware deprecado no debe aparecer (ya renombramos a proxy.ts).

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Resultado esperado: sin errores ni warnings.

- [ ] **Step 4: Commit de cualquier fix menor que sea necesario**

```bash
git add -p
git commit -m "fix: correcciones menores de build post-migración"
```

---

## Task 33: Deploy a Vercel

**Files:** ninguno (configuración de plataforma)

- [ ] **Step 1: Instalar Vercel CLI si no está instalado**

```bash
npx vercel --version
```
Si no responde, instalar: `npm i -g vercel`

- [ ] **Step 2: Crear el proyecto en Vercel**

```bash
npx vercel
```
Seguir el wizard:
- Link to existing project? → No
- Project name: `credicontrol`
- Framework: Next.js (auto-detectado)
- Build command: `npm run build` (default)
- Output directory: `.next` (default)

- [ ] **Step 3: Configurar variables de entorno en Vercel Dashboard**

Ir a `vercel.com` → proyecto `credicontrol` → Settings → Environment Variables.
Agregar para `Production`:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://aamfmqhhmuwnyqdsqklr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (obtener de Supabase Dashboard → Settings → API → anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (obtener de Supabase Dashboard → Settings → API → service_role key) |
| `NEXT_PUBLIC_APP_URL` | `https://<proyecto>.vercel.app` (URL que Vercel asignó) |
| `NODE_ENV` | `production` |

- [ ] **Step 4: Hacer el deploy a producción**

```bash
npx vercel --prod
```
Resultado esperado: URL de producción como `https://credicontrol-xxx.vercel.app`

- [ ] **Step 5: Verificar que la app funciona**

Abrir la URL de producción en el navegador y verificar:
- `/login` carga correctamente
- Login con credenciales reales funciona
- Dashboard muestra datos de Supabase (no mock)
- `/api/health` responde 200

---

## Task 34: Acciones manuales en Supabase Dashboard (post-deploy)

**Files:** ninguno (configuración de plataforma)

- [ ] **Step 1: Habilitar Custom Access Token Hook**

1. Ir a `https://supabase.com/dashboard/project/aamfmqhhmuwnyqdsqklr`
2. Menú izquierdo → **Auth** → **Hooks**
3. Buscar **Custom Access Token**
4. Configurar: Type=Custom Access Token, Schema=public, Function=`custom_access_token_hook`
5. Toggle → **Enabled** → Guardar

- [ ] **Step 2: Habilitar Leaked Password Protection**

1. En Supabase Dashboard → **Auth** → **Password Security**
2. Toggle **Leaked Password Protection** → ON
3. Guardar

- [ ] **Step 3: Rotar passwords de usuarios seed**

En Supabase Dashboard → **Authentication** → **Users**:
- Cambiar la contraseña de cada usuario seed (`*@credicontrol.test`) por una contraseña segura aleatoria, o eliminarlos si no se usarán en producción.

- [ ] **Step 4: Invalidar sesiones existentes**

En Supabase Dashboard → **SQL Editor**:
```sql
update auth.sessions set revoked_at = now() where revoked_at is null;
```

Todos los usuarios deberán volver a iniciar sesión para recibir el JWT actualizado con claims `rol` y `organization_id`.

- [ ] **Step 5: Verificar que el JWT incluye claims correctos**

Iniciar sesión en la app de producción con un usuario admin.
Abrir DevTools → Application → Cookies → buscar la cookie de sesión de Supabase.
O ejecutar en SQL Editor:
```sql
select auth.jwt()->>'rol' as rol, auth.jwt()->>'organization_id' as org_id;
```
Resultado esperado: `rol` y `organization_id` no nulos.

---

## Checklist final de producción

Ejecutar antes de dar por completado el deploy:

- [ ] `npm test` — todos los tests pasan
- [ ] `npm run build` — sin errores
- [ ] App carga en URL de Vercel
- [ ] Login funciona con usuario real
- [ ] Dashboard muestra datos reales (no "Cliente A-Uno")
- [ ] Custom Access Token Hook habilitado en Supabase
- [ ] Leaked Password Protection habilitada
- [ ] Passwords seed rotados
- [ ] `/api/health` responde 200 en producción
- [ ] CSP sin `unsafe-inline` en headers de producción
