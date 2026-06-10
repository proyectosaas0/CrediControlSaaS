# Fase 0 — Seguridad Crítica: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar los bloqueadores de seguridad para producción: protección de rutas server-side (middleware), enforcement de suscripción en el API, rate-limiting realmente aplicado, y eliminación del endpoint de debug.

**Architecture:** La lógica de decisión (¿activa la suscripción? ¿se permite esta ruta?) se extrae a **funciones puras** en `lib/domain/` y `lib/auth/` para poder testearla con TDD sin levantar el runtime de middleware de Next. El `middleware.ts` y `requireApiActor` quedan como capas delgadas que consumen esas funciones puras. Esto sigue el patrón SSR oficial de Supabase (no ejecutar código entre `createServerClient` y la lectura de claims) y separa política de plumbing.

**Tech Stack:** Next.js 16 (App Router + middleware), `@supabase/ssr`, Supabase Auth (JWT con Custom Access Token Hook: claims `rol` y `organization_id` a primer nivel), Vitest, `@upstash/ratelimit`.

> **AVISO (de AGENTS.md):** Esta versión de Next.js tiene breaking changes. **Antes de escribir el `middleware.ts` y `lib/supabase/middleware.ts`**, leer la guía de middleware/SSR en `node_modules/next/dist/docs/` y respetar deprecaciones. No asumir la API de versiones anteriores.

> **Nota de alcance:** El login/registro ocurre en el navegador llamando directamente a Supabase Auth (`signInWithPassword` / `signUp`), **no pasa por nuestro API**. Por eso el rate-limit de fuerza bruta del login se configura en el dashboard de Supabase Auth (no en este código). Aquí aplicamos `apiRateLimit` a nuestro API (catch-all), que es lo que sí controlamos.

---

## File Structure

| Archivo | Responsabilidad | Acción |
|---------|-----------------|--------|
| `lib/domain/subscription.ts` | Función pura: ¿está activa la suscripción de un tenant? | Crear |
| `lib/auth/route-guard.ts` | Función pura: dada una ruta + sesión + rol + suscripción, ¿permitir o redirigir? | Crear |
| `lib/supabase/middleware.ts` | `updateSession`: capa SSR que refresca sesión, lee claims, consulta estado de org y aplica `route-guard`. | Crear |
| `middleware.ts` (raíz) | Entry point de Next middleware + `matcher`. | Crear |
| `app/suscripcion-vencida/page.tsx` | Página de renovación para tenants vencidos/suspendidos. | Crear |
| `lib/api/errors.ts` | Añadir código `SUBSCRIPTION_EXPIRED`. | Modificar |
| `lib/api/auth.ts` | `requireApiActor`: traer estado de la org y bloquear con 402 si no está activa. | Modificar |
| `lib/api/rate-limit.ts` | Fail-closed: loguear error en producción si falta Upstash. | Modificar |
| `lib/api/with-rate-limit.ts` | Aceptar `Request` y limiter inyectable (testabilidad). | Modificar |
| `app/api/[...path]/route.ts` | Envolver los handlers con rate-limit. | Modificar |
| `app/api/debug/me/route.ts` | Endpoint de debug. | **Eliminar** |
| Tests varios | Cobertura TDD. | Crear |

---

## Task 1: Función pura de estado de suscripción

**Files:**
- Create: `lib/domain/subscription.ts`
- Test: `tests/unit/subscription.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/subscription.test.ts
import { describe, it, expect } from "vitest";
import { isSubscriptionActive } from "@/lib/domain/subscription";

describe("isSubscriptionActive", () => {
  const today = "2026-06-09";

  it("activo siempre está activo", () => {
    expect(isSubscriptionActive({ estado: "activo", trialHasta: null, today })).toBe(true);
  });

  it("suspendido nunca está activo", () => {
    expect(isSubscriptionActive({ estado: "suspendido", trialHasta: "2099-01-01", today })).toBe(false);
  });

  it("vencido nunca está activo", () => {
    expect(isSubscriptionActive({ estado: "vencido", trialHasta: "2099-01-01", today })).toBe(false);
  });

  it("trial vigente (trial_hasta >= hoy) está activo", () => {
    expect(isSubscriptionActive({ estado: "trial", trialHasta: "2026-06-09", today })).toBe(true);
    expect(isSubscriptionActive({ estado: "trial", trialHasta: "2026-06-30", today })).toBe(true);
  });

  it("trial expirado (trial_hasta < hoy) NO está activo", () => {
    expect(isSubscriptionActive({ estado: "trial", trialHasta: "2026-06-08", today })).toBe(false);
  });

  it("trial sin fecha no está activo", () => {
    expect(isSubscriptionActive({ estado: "trial", trialHasta: null, today })).toBe(false);
  });

  it("estado desconocido no está activo", () => {
    expect(isSubscriptionActive({ estado: "loquesea", trialHasta: null, today })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/subscription.test.ts`
Expected: FAIL — "Failed to resolve import '@/lib/domain/subscription'".

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/domain/subscription.ts
export type EstadoSuscripcion = "activo" | "trial" | "vencido" | "suspendido";

/**
 * ¿Puede operar este tenant?
 * - activo: sí
 * - trial: solo si hoy <= trial_hasta (comparación de fechas YYYY-MM-DD)
 * - vencido / suspendido / desconocido: no
 * `today` se inyecta para tests deterministas; default = hoy en UTC.
 */
export function isSubscriptionActive(params: {
  estado: string;
  trialHasta: string | null;
  today?: string;
}): boolean {
  const { estado, trialHasta } = params;
  const today = params.today ?? new Date().toISOString().slice(0, 10);

  if (estado === "activo") return true;
  if (estado === "trial") {
    if (!trialHasta) return false;
    return today <= trialHasta; // ISO date strings comparan lexicográficamente
  }
  return false; // vencido, suspendido, desconocido
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/subscription.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/domain/subscription.ts tests/unit/subscription.test.ts
git commit -m "feat(domain): add isSubscriptionActive pure function"
```

---

## Task 2: Enforcement de suscripción en requireApiActor

**Files:**
- Modify: `lib/api/errors.ts` (añadir `SUBSCRIPTION_EXPIRED` al union)
- Modify: `lib/api/auth.ts` (traer estado de org y bloquear)
- Test: `tests/unit/subscription-enforcement.test.ts`

- [ ] **Step 1: Add the error code (no test needed — type-only change)**

En `lib/api/errors.ts`, añadir el código al union `ApiErrorCode`:

```ts
export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SUBSCRIPTION_EXPIRED"
  | "INTERNAL_ERROR";
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/unit/subscription-enforcement.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookiesGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: mockCookiesGet })),
  headers: vi.fn(() => Promise.resolve({ get: vi.fn() })),
}));

const mockGetClaims = vi.fn();
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { getClaims: mockGetClaims }, from: mockFrom }),
  ),
}));

import { requireApiActor } from "@/lib/api/auth";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const ORG_ID = "22222222-2222-2222-2222-222222222222";

function mockProfile(org: { estado_suscripcion: string; trial_hasta: string | null } | null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { organization_id: ORG_ID, rol: "admin", activo: true, organizations: org },
      error: null,
    }),
  });
}

describe("requireApiActor — enforcement de suscripción", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesGet.mockReturnValue(undefined);
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: ADMIN_ID, rol: "admin", organization_id: ORG_ID } },
      error: null,
    });
  });

  it("permite admin con suscripción activa", async () => {
    mockProfile({ estado_suscripcion: "activo", trial_hasta: null });
    const { actor, response } = await requireApiActor();
    expect(response).toBeNull();
    expect(actor?.organizationId).toBe(ORG_ID);
  });

  it("bloquea con 402 a admin con tenant suspendido", async () => {
    mockProfile({ estado_suscripcion: "suspendido", trial_hasta: null });
    const { actor, response } = await requireApiActor();
    expect(actor).toBeNull();
    expect(response?.status).toBe(402);
  });

  it("bloquea con 402 a admin con trial expirado", async () => {
    mockProfile({ estado_suscripcion: "trial", trial_hasta: "2000-01-01" });
    const { response } = await requireApiActor();
    expect(response?.status).toBe(402);
  });

  it("NO bloquea a super_admin aunque la org esté vencida", async () => {
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: ADMIN_ID, rol: "super_admin", organization_id: null } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { organization_id: null, rol: "super_admin", activo: true, organizations: null },
        error: null,
      }),
    });
    const { response } = await requireApiActor();
    expect(response).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/subscription-enforcement.test.ts`
Expected: FAIL — el tenant suspendido/expirado NO devuelve 402 todavía (el chequeo no existe).

- [ ] **Step 4: Modify `lib/api/auth.ts`**

Añadir el import al inicio:

```ts
import { isSubscriptionActive } from "@/lib/domain/subscription";
```

Cambiar la consulta del profile para incluir el estado de la org (relación many-to-one `profiles.organization_id → organizations`):

```ts
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id, rol, activo, organizations(estado_suscripcion, trial_hasta)")
    .eq("id", actor.userId)
    .maybeSingle();
```

Después del bloque que valida el rol (justo antes de la inyección de org por cookie para super_admin), añadir el enforcement de suscripción:

```ts
  // Enforcement de suscripción (super_admin exento)
  if (actor.role !== "super_admin") {
    const org = (profile as { organizations?: { estado_suscripcion: string; trial_hasta: string | null } | null })
      .organizations ?? null;
    const activa = org
      ? isSubscriptionActive({ estado: org.estado_suscripcion, trialHasta: org.trial_hasta })
      : false;
    if (!activa) {
      return {
        actor: null,
        response: apiError("SUBSCRIPTION_EXPIRED", "Suscripción vencida o suspendida", 402),
      };
    }
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/subscription-enforcement.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Run the existing super_admin auth test to confirm no regression**

Run: `npx vitest run tests/unit/super-admin-auth.test.ts`
Expected: PASS (los mocks usan `mockReturnThis()` para `select`, así que el nuevo string de select no los rompe; super_admin está exento del nuevo chequeo).

- [ ] **Step 7: Commit**

```bash
git add lib/api/errors.ts lib/api/auth.ts tests/unit/subscription-enforcement.test.ts
git commit -m "feat(api): block expired/suspended tenants with 402 in requireApiActor"
```

---

## Task 3: Función pura de guard de rutas

**Files:**
- Create: `lib/auth/route-guard.ts`
- Test: `tests/unit/route-guard.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/route-guard.test.ts
import { describe, it, expect } from "vitest";
import { evaluateRouteAccess } from "@/lib/auth/route-guard";

describe("evaluateRouteAccess", () => {
  it("redirige a /login si /app sin sesión, preservando redirect", () => {
    const d = evaluateRouteAccess({ pathname: "/app/prestamos", isAuthenticated: false, role: null, subscriptionActive: false });
    expect(d).toEqual({ action: "redirect", to: "/login?redirect=%2Fapp%2Fprestamos" });
  });

  it("permite admin con suscripción activa en /app", () => {
    const d = evaluateRouteAccess({ pathname: "/app", isAuthenticated: true, role: "admin", subscriptionActive: true });
    expect(d).toEqual({ action: "allow" });
  });

  it("redirige a /suscripcion-vencida si /app con suscripción inactiva", () => {
    const d = evaluateRouteAccess({ pathname: "/app/caja", isAuthenticated: true, role: "admin", subscriptionActive: false });
    expect(d).toEqual({ action: "redirect", to: "/suscripcion-vencida" });
  });

  it("redirige a /app si cobrador intenta entrar a ruta de super-admin", () => {
    const d = evaluateRouteAccess({ pathname: "/tenants", isAuthenticated: true, role: "cobrador", subscriptionActive: true });
    expect(d).toEqual({ action: "redirect", to: "/app" });
  });

  it("permite super_admin en /dashboard", () => {
    const d = evaluateRouteAccess({ pathname: "/dashboard", isAuthenticated: true, role: "super_admin", subscriptionActive: true });
    expect(d).toEqual({ action: "allow" });
  });

  it("redirige usuario autenticado fuera de /login según su rol", () => {
    expect(evaluateRouteAccess({ pathname: "/login", isAuthenticated: true, role: "admin", subscriptionActive: true }))
      .toEqual({ action: "redirect", to: "/app" });
    expect(evaluateRouteAccess({ pathname: "/login", isAuthenticated: true, role: "super_admin", subscriptionActive: true }))
      .toEqual({ action: "redirect", to: "/dashboard" });
  });

  it("permite /suscripcion-vencida aunque la suscripción esté inactiva", () => {
    const d = evaluateRouteAccess({ pathname: "/suscripcion-vencida", isAuthenticated: true, role: "admin", subscriptionActive: false });
    expect(d).toEqual({ action: "allow" });
  });

  it("permite rutas públicas no protegidas sin sesión", () => {
    const d = evaluateRouteAccess({ pathname: "/", isAuthenticated: false, role: null, subscriptionActive: false });
    expect(d).toEqual({ action: "allow" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/route-guard.test.ts`
Expected: FAIL — "Failed to resolve import '@/lib/auth/route-guard'".

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/auth/route-guard.ts
export type RouteRole = "super_admin" | "admin" | "cobrador" | null;
export type RouteDecision = { action: "allow" } | { action: "redirect"; to: string };

// Rutas del grupo (super-admin): los route groups NO añaden segmento a la URL.
const SUPER_ADMIN_PREFIXES = ["/dashboard", "/tenants", "/suscripciones", "/metricas"];
const AUTH_PAGES = ["/login", "/register"];

export function evaluateRouteAccess(params: {
  pathname: string;
  isAuthenticated: boolean;
  role: RouteRole;
  subscriptionActive: boolean;
}): RouteDecision {
  const { pathname, isAuthenticated, role, subscriptionActive } = params;

  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
  const isSuperAdminRoute = SUPER_ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Usuario autenticado en páginas de auth → a su home
  if (isAuthenticated && isAuthPage) {
    return { action: "redirect", to: role === "super_admin" ? "/dashboard" : "/app" };
  }

  if (isAppRoute) {
    if (!isAuthenticated) {
      return { action: "redirect", to: `/login?redirect=${encodeURIComponent(pathname)}` };
    }
    if (role !== "admin" && role !== "cobrador") {
      return { action: "redirect", to: "/login" };
    }
    if (!subscriptionActive) {
      return { action: "redirect", to: "/suscripcion-vencida" };
    }
    return { action: "allow" };
  }

  if (isSuperAdminRoute) {
    if (!isAuthenticated) return { action: "redirect", to: "/login" };
    if (role !== "super_admin") return { action: "redirect", to: "/app" };
    return { action: "allow" };
  }

  // Todo lo demás (/, /suscripcion-vencida, assets, etc.) se permite
  return { action: "allow" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/route-guard.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/route-guard.ts tests/unit/route-guard.test.ts
git commit -m "feat(auth): add pure evaluateRouteAccess route guard"
```

---

## Task 4: Página de suscripción vencida

**Files:**
- Create: `app/suscripcion-vencida/page.tsx`

- [ ] **Step 1: Read the existing UI primitives to match style**

Run: `sed -n '1,40p' components/ui/card.tsx` y `sed -n '1,40p' components/ui/button.tsx`
Propósito: usar los componentes `Card`/`Button` existentes con sus props reales (no inventar APIs).

- [ ] **Step 2: Create the page (server component, sin estado)**

```tsx
// app/suscripcion-vencida/page.tsx
import Link from "next/link";

export default function SuscripcionVencidaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-foreground">Suscripción inactiva</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tu suscripción está vencida o suspendida. Para reactivar tu cuenta y volver a
          operar, contacta al administrador de CrédiControl.
        </p>
        <a
          href="https://wa.me/573000000000"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Contactar soporte
        </a>
        <Link
          href="/login"
          className="mt-3 inline-block text-sm text-muted-foreground underline"
        >
          Cerrar sesión / volver al login
        </Link>
      </div>
    </main>
  );
}
```

> Reemplazar el número `573000000000` por el número real de soporte antes de producción.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en este archivo.

- [ ] **Step 4: Commit**

```bash
git add app/suscripcion-vencida/page.tsx
git commit -m "feat(ui): add suscripcion-vencida renewal page"
```

---

## Task 5: Middleware SSR (updateSession + middleware.ts)

**Files:**
- Create: `lib/supabase/middleware.ts`
- Create: `middleware.ts`
- Test: `tests/unit/middleware-module.test.ts` (contract: el módulo importa y exporta `config.matcher`)

> Las funciones puras de decisión ya están testeadas (Tasks 1 y 3). Este task ensambla la capa SSR. El runtime de middleware de Next no se testea unitariamente aquí; se verifica manualmente al final (Task 8).

- [ ] **Step 1: Read the Next.js middleware docs (REQUERIDO por AGENTS.md)**

Run: `ls node_modules/next/dist/docs/ && grep -rl -i "middleware" node_modules/next/dist/docs/ | head`
Leer la guía de middleware antes de codear. Confirmar la firma de `middleware`, el formato de `config.matcher`, y la API de `NextResponse.redirect` en esta versión.

- [ ] **Step 2: Create `lib/supabase/middleware.ts`**

```ts
// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { evaluateRouteAccess, type RouteRole } from "@/lib/auth/route-guard";
import { isSubscriptionActive } from "@/lib/domain/subscription";
import type { Database } from "@/lib/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE (patrón SSR Supabase): no ejecutar código entre createServerClient
  // y la lectura de claims. getClaims() verifica/refresca el token.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;
  const isAuthenticated = Boolean(claims?.sub);
  const role = ((claims?.rol as RouteRole | undefined) ?? null) as RouteRole;
  const orgId = (claims?.organization_id as string | undefined) ?? null;

  // Estado de suscripción solo importa para admin/cobrador en rutas /app
  let subscriptionActive = true;
  if (isAuthenticated && role !== "super_admin") {
    if (orgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("estado_suscripcion, trial_hasta")
        .eq("id", orgId)
        .maybeSingle();
      subscriptionActive = org
        ? isSubscriptionActive({ estado: org.estado_suscripcion, trialHasta: org.trial_hasta })
        : false;
    } else {
      subscriptionActive = false;
    }
  }

  const decision = evaluateRouteAccess({
    pathname: request.nextUrl.pathname,
    isAuthenticated,
    role,
    subscriptionActive,
  });

  if (decision.action === "redirect") {
    const url = request.nextUrl.clone();
    const [path, query = ""] = decision.to.split("?");
    url.pathname = path;
    url.search = query ? `?${query}` : "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 3: Create `middleware.ts` (raíz del proyecto)**

```ts
// middleware.ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Todo excepto assets estáticos e imágenes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 4: Write a contract test for the middleware module**

```ts
// tests/unit/middleware-module.test.ts
import { describe, it, expect } from "vitest";

describe("middleware module", () => {
  it("exporta middleware y config.matcher", async () => {
    const mod = await import("../../middleware");
    expect(typeof mod.middleware).toBe("function");
    expect(Array.isArray(mod.config.matcher)).toBe(true);
    expect(mod.config.matcher.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: Run the contract test**

Run: `npx vitest run tests/unit/middleware-module.test.ts`
Expected: PASS.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add middleware.ts lib/supabase/middleware.ts tests/unit/middleware-module.test.ts
git commit -m "feat(auth): add SSR middleware with server-side route protection"
```

---

## Task 6: Rate-limiting aplicado + fail-closed

**Files:**
- Modify: `lib/api/rate-limit.ts` (fail-closed warning en producción)
- Modify: `lib/api/with-rate-limit.ts` (aceptar `Request` + limiter inyectable)
- Modify: `app/api/[...path]/route.ts` (envolver handlers)
- Test: `tests/unit/with-rate-limit.test.ts`

- [ ] **Step 1: Write the failing test for withRateLimit**

```ts
// tests/unit/with-rate-limit.test.ts
import { describe, it, expect, vi } from "vitest";
import { withRateLimit } from "@/lib/api/with-rate-limit";
import type { Ratelimit } from "@upstash/ratelimit";

function fakeLimiter(allowed: boolean): Ratelimit {
  return {
    limit: vi.fn().mockResolvedValue({
      success: allowed,
      remaining: allowed ? 99 : 0,
      reset: 1234,
      limit: 100,
      pending: Promise.resolve(),
    }),
  } as unknown as Ratelimit;
}

const req = new Request("http://localhost/api/prestamos", {
  headers: { "x-forwarded-for": "1.2.3.4" },
});

describe("withRateLimit", () => {
  it("ejecuta el handler cuando está permitido y añade headers", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const res = await withRateLimit(req, handler, fakeLimiter(true));
    expect(handler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("99");
  });

  it("devuelve 429 sin ejecutar el handler cuando se excede", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const res = await withRateLimit(req, handler, fakeLimiter(false));
    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(429);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/with-rate-limit.test.ts`
Expected: FAIL — la firma actual de `withRateLimit` no acepta un tercer parámetro `limiter`.

- [ ] **Step 3: Modify `lib/api/with-rate-limit.ts`**

Reemplazar el contenido completo del archivo por:

```ts
import { apiError } from "@/lib/api/errors";
import { checkRateLimit, apiRateLimit } from "@/lib/api/rate-limit";
import type { Ratelimit } from "@upstash/ratelimit";

export async function withRateLimit(
  request: Request,
  handler: (request: Request) => Promise<Response>,
  limiter: Ratelimit | null = apiRateLimit,
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const result = await checkRateLimit(ip, limiter);

  if (!result.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Demasiadas solicitudes. Intenta de nuevo más tarde.",
      429,
      { retryAfter: result.resetAfter },
    );
  }

  const response = await handler(request);
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetAfter));
  return response;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/with-rate-limit.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Add fail-closed warning in `lib/api/rate-limit.ts`**

Añadir el import del logger al inicio:

```ts
import { logger } from "@/lib/logger";
```

Reemplazar la función `createRedis` por:

```ts
function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      logger.error(
        "Rate limiting DESACTIVADO: faltan UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN en producción",
      );
    }
    return null;
  }
  return new Redis({ url, token });
}
```

- [ ] **Step 6: Wrap the catch-all handlers with rate limiting**

En `app/api/[...path]/route.ts`, añadir el import al inicio:

```ts
import { withRateLimit } from "@/lib/api/with-rate-limit";
```

Renombrar las cuatro funciones exportadas a privadas y añadir wrappers que aplican rate-limit. Es decir, cambiar cada `export async function GET(...)` → `async function dispatchGet(...)` (igual para POST/PUT/DELETE), y al final del archivo añadir:

```ts
export async function GET(request: Request, context: RouteContext) {
  return withRateLimit(request, () => dispatchGet(request, context));
}
export async function POST(request: Request, context: RouteContext) {
  return withRateLimit(request, () => dispatchPost(request, context));
}
export async function PUT(request: Request, context: RouteContext) {
  return withRateLimit(request, () => dispatchPut(request, context));
}
export async function DELETE(request: Request, context: RouteContext) {
  return withRateLimit(request, () => dispatchDelete(request, context));
}
```

(Renombrados internos: `GET→dispatchGet`, `POST→dispatchPost`, `PUT→dispatchPut`, `DELETE→dispatchDelete`. Las firmas y cuerpos no cambian.)

- [ ] **Step 7: Run the nested dispatch contract test to confirm no regression**

Run: `npx vitest run tests/api/nested-api-dispatch.test.ts`
Expected: PASS (el dispatch sigue funcionando; los wrappers no alteran el routing). Si el test importaba `GET`/`POST` por nombre, sigue resolviendo a los nuevos exports.

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 9: Commit**

```bash
git add lib/api/rate-limit.ts lib/api/with-rate-limit.ts app/api/[...path]/route.ts tests/unit/with-rate-limit.test.ts
git commit -m "feat(api): apply rate limiting to API and fail-closed in production"
```

---

## Task 7: Eliminar endpoint de debug

**Files:**
- Delete: `app/api/debug/me/route.ts`
- Test: `tests/unit/no-debug-endpoint.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/no-debug-endpoint.test.ts
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

describe("debug endpoint", () => {
  it("no existe en el árbol de rutas", () => {
    expect(existsSync(resolve(process.cwd(), "app/api/debug/me/route.ts"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/no-debug-endpoint.test.ts`
Expected: FAIL — el archivo todavía existe.

- [ ] **Step 3: Delete the endpoint (and empty dirs)**

Run:
```bash
git rm app/api/debug/me/route.ts
rmdir app/api/debug/me app/api/debug 2>/dev/null || true
```

- [ ] **Step 4: Confirm nothing references it**

Run: `grep -rn "debug/me\|api/debug" app lib components tests || echo "sin referencias"`
Expected: "sin referencias" (si aparece algo, eliminar esa referencia).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/no-debug-endpoint.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove debug endpoint from production"
```

---

## Task 8: Verificación integral de la Fase 0

**Files:** ninguno (verificación)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: toda la suite en verde (incluye los nuevos tests + los RLS isolation + contract existentes).

- [ ] **Step 2: Type-check y lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 3: Build de producción**

Run: `npm run build`
Expected: build exitoso (confirma que el middleware compila para el runtime correcto).

- [ ] **Step 4: Verificación manual con la app corriendo**

Usar la skill `run` (o `npm run dev`) y verificar manualmente:
1. Visitar `/app/prestamos` **sin sesión** → redirige a `/login?redirect=%2Fapp%2Fprestamos`. ✅
2. Login como `admin` de un tenant activo → entra a `/app`. ✅
3. Con el super_admin, suspender ese tenant (`/tenants` → suspender). Recargar `/app` como ese admin → redirige a `/suscripcion-vencida`, y cualquier llamada al API devuelve 402. ✅
4. Reactivar el tenant → el admin vuelve a operar. ✅
5. Login como `cobrador` y visitar `/tenants` → redirige a `/app`. ✅
6. `GET /api/debug/me` → 404. ✅

- [ ] **Step 5: (Si el proyecto Supabase correcto está vinculado) correr advisors**

Vincular el proyecto real de cobradiario y correr los advisors de seguridad para confirmar que no hay regresiones de RLS introducidas. (El RLS no se modifica en Fase 0; esto es un chequeo de sanidad.)

- [ ] **Step 6: Final commit del estado de la fase**

```bash
git add -A
git commit -m "test: verify Fase 0 security hardening end-to-end" --allow-empty
```

---

## Notas para Fases siguientes

Este plan cubre **solo la Fase 0** del spec `docs/superpowers/specs/2026-06-09-saas-readiness-remediation-design.md`. Cada fase restante es un subsistema independiente con su propio plan:

- **Fase 1** — Configuración conectada a `tenant_settings` (`GET/PUT /api/configuracion` + migración de columnas).
- **Fase 2** — Hardening de plataforma (`next.config.ts`, RLS initplan optimization, CSP por nonce).
- **Fase 3** — Go-to-market (onboarding, planes con límites, emails transaccionales, activación manual mejorada).

Generar el plan de cada fase con la skill `writing-plans` cuando se vaya a ejecutar.
