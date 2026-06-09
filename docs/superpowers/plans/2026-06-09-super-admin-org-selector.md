# Super Admin Org Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Super admin can select an active organization from the header and fully administer it (reads + writes) through every existing module.

**Architecture:** The client stores the selected org in `localStorage` and a browser cookie (`active-org-id`). The auth provider exposes `effectiveOrgId = orgId ?? activeOrgId`. Pages/hooks replace `orgId` with `effectiveOrgId`. On the server, `requireApiActor` reads the cookie when `role === 'super_admin'` and has no JWT org — all existing API routes work unchanged.

**Tech Stack:** Next.js App Router, React, Supabase SSR (`@supabase/ssr`), Vitest, TanStack Query, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/api/auth.ts` | Modify | Read `active-org-id` cookie for super_admin |
| `providers/auth-provider.tsx` | Modify | Add `activeOrgId`, `effectiveOrgId`, `setActiveOrgId` |
| `components/layout/org-switcher.tsx` | Create | Org dropdown shown only to super_admin |
| `components/layout/header.tsx` | Modify | Render `<OrgSwitcher />` |
| `app/app/caja/page.tsx` | Modify | Use `effectiveOrgId`, remove org guard |
| `app/app/ruta/page.tsx` | Modify | Use `effectiveOrgId` |
| `app/api/auth/me/route.ts` | Modify | Remove debug log |
| `tests/unit/super-admin-auth.test.ts` | Create | Unit test for cookie injection |

---

## Task 1: Server — inject cookie org for super_admin in `requireApiActor`

**Files:**
- Modify: `lib/api/auth.ts`
- Create: `tests/unit/super-admin-auth.test.ts`

### Context

`requireApiActor` in `lib/api/auth.ts` resolves `actor.organizationId` from the JWT claim, falling back to the `profiles` table. For super_admin the profile has `organization_id: null`. After the existing fallback, we add one more: read the `active-org-id` cookie via `cookies()` from `next/headers`.

Current tail of `requireApiActor` (after the profile fallback block):

```ts
actor.role = actor.role ?? profile.rol;
actor.organizationId = actor.organizationId ?? profile.organization_id;

if (!actor.role || (roles && !roles.includes(actor.role))) {
  return { actor: null, response: apiError("FORBIDDEN", "Rol no autorizado", 403) };
}

return { actor, response: null };
```

- [ ] **Step 1: Write the failing test**

Create `tests/unit/super-admin-auth.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers before importing the module under test
const mockCookiesGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: mockCookiesGet })),
  headers: vi.fn(() => Promise.resolve({ get: vi.fn() })),
}));

// Mock supabase server client
const mockGetClaims = vi.fn();
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getClaims: mockGetClaims },
      from: mockFrom,
    })
  ),
}));

import { requireApiActor } from "@/lib/api/auth";

describe("requireApiActor — super_admin cookie org injection", () => {
  const SUPER_ADMIN_ID = "d8b357ca-2d3e-47e6-893b-20269dbbdcdd";
  const ORG_ID = "0d549dc6-eff5-435c-b2e4-2ed1ac1823c0";

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: SUPER_ADMIN_ID, rol: "super_admin" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { organization_id: null, rol: "super_admin", activo: true },
        error: null,
      }),
    });
  });

  it("uses cookie org when super_admin has no JWT org", async () => {
    mockCookiesGet.mockReturnValue({ value: ORG_ID });

    const { actor, response } = await requireApiActor();

    expect(response).toBeNull();
    expect(actor?.organizationId).toBe(ORG_ID);
    expect(actor?.role).toBe("super_admin");
  });

  it("leaves organizationId null when cookie is absent", async () => {
    mockCookiesGet.mockReturnValue(undefined);

    const { actor } = await requireApiActor();

    expect(actor?.organizationId).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd /home/juanda/cobradiario && npx vitest run tests/unit/super-admin-auth.test.ts
```

Expected: FAIL — `actor?.organizationId` is `null`, not `ORG_ID`.

- [ ] **Step 3: Add cookie injection to `lib/api/auth.ts`**

Add `cookies` import at the top:

```ts
import { cookies } from "next/headers";
```

Replace the final `return { actor, response: null }` with:

```ts
  // Super admin can impersonate an org via the active-org-id cookie
  if (actor.role === "super_admin" && !actor.organizationId) {
    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active-org-id")?.value ?? null;
    if (activeOrgId) actor.organizationId = activeOrgId;
  }

  return { actor, response: null };
```

The full modified tail of `requireApiActor` now looks like:

```ts
  actor.role = actor.role ?? profile.rol;
  actor.organizationId = actor.organizationId ?? profile.organization_id;

  if (!actor.role || (roles && !roles.includes(actor.role))) {
    return { actor: null, response: apiError("FORBIDDEN", "Rol no autorizado", 403) };
  }

  // Super admin can impersonate an org via the active-org-id cookie
  if (actor.role === "super_admin" && !actor.organizationId) {
    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active-org-id")?.value ?? null;
    if (activeOrgId) actor.organizationId = activeOrgId;
  }

  return { actor, response: null };
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd /home/juanda/cobradiario && npx vitest run tests/unit/super-admin-auth.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
cd /home/juanda/cobradiario && npx vitest run
```

Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add lib/api/auth.ts tests/unit/super-admin-auth.test.ts
git commit -m "feat: inject active-org cookie for super_admin in requireApiActor"
```

---

## Task 2: Auth provider — add `activeOrgId`, `effectiveOrgId`, `setActiveOrgId`

**Files:**
- Modify: `providers/auth-provider.tsx`

### Context

The provider uses a module-level singleton pattern (`authState`, `emitChange`). `AuthContextValue` currently has `{ user, role, orgId, loading, signOut }`. We add three values: `activeOrgId` (localStorage-backed), `effectiveOrgId` (derived), and `setActiveOrgId` (setter).

`activeOrgId` lives in React `useState` inside `AuthProvider` — not in the global `authState` (which is for JWT-derived state). `effectiveOrgId` is computed as `orgId ?? activeOrgId`.

- [ ] **Step 1: Add `activeOrgId` and `effectiveOrgId` to the context type**

In `providers/auth-provider.tsx`, update `AuthContextValue`:

```ts
type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
  activeOrgId: string | null;
  effectiveOrgId: string | null;
  setActiveOrgId: (id: string) => void;
};
```

Update the `createContext` default value:

```ts
const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  orgId: null,
  loading: true,
  signOut: async () => {},
  activeOrgId: null,
  effectiveOrgId: null,
  setActiveOrgId: () => {},
});
```

- [ ] **Step 2: Add `activeOrgId` state and `setActiveOrgId` to `AuthProvider`**

Inside `AuthProvider`, add after the existing `const [, forceUpdate] = useState(0)` line:

```ts
const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("active-org-id") ?? null;
});

const setActiveOrgId = useCallback((id: string) => {
  setActiveOrgIdState(id);
  localStorage.setItem("active-org-id", id);
  document.cookie = `active-org-id=${id}; path=/; max-age=604800; SameSite=Strict`;
}, []);
```

- [ ] **Step 3: Compute `effectiveOrgId` and pass everything to the context**

Replace the existing `return` in `AuthProvider` (the `AuthContext.Provider` call):

```ts
const effectiveOrgId = state.orgId ?? activeOrgId;

return (
  <AuthContext.Provider value={{ ...state, signOut, activeOrgId, effectiveOrgId, setActiveOrgId }}>
    {children}
  </AuthContext.Provider>
);
```

- [ ] **Step 4: Verify the app compiles**

```bash
cd /home/juanda/cobradiario && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new type errors.

- [ ] **Step 5: Commit**

```bash
git add providers/auth-provider.tsx
git commit -m "feat: add activeOrgId, effectiveOrgId, setActiveOrgId to auth provider"
```

---

## Task 3: Create `OrgSwitcher` component

**Files:**
- Create: `components/layout/org-switcher.tsx`

### Context

The `useTenants()` hook in `hooks/queries/use-super-admin.ts` already fetches all organizations from `/api/super-admin/tenants`. The `Tenant` type is `{ id, nombre_negocio, ciudad, plan, estado_suscripcion, trial_hasta, created_at }`. The component calls `setActiveOrgId` from `useAuth()`.

- [ ] **Step 1: Create the component**

Create `components/layout/org-switcher.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useTenants } from "@/hooks/queries/use-super-admin";

export function OrgSwitcher() {
  const { effectiveOrgId, setActiveOrgId } = useAuth();
  const { data: tenants = [] } = useTenants();
  const [open, setOpen] = useState(false);

  const activeOrg = tenants.find((t) => t.id === effectiveOrgId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-expanded={open}
        aria-label="Seleccionar organización"
      >
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[140px] truncate">
          {activeOrg?.nombre_negocio ?? "Seleccionar org"}
        </span>
        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-50 w-56 rounded-xl border border-border bg-card py-1 shadow-lg">
            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Organizaciones
            </p>
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => {
                  setActiveOrgId(tenant.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <span className="truncate">{tenant.nombre_negocio}</span>
                {tenant.id === effectiveOrgId && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the app compiles**

```bash
cd /home/juanda/cobradiario && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/layout/org-switcher.tsx
git commit -m "feat: add OrgSwitcher component for super_admin"
```

---

## Task 4: Add `OrgSwitcher` to the header

**Files:**
- Modify: `components/layout/header.tsx`

### Context

The header receives `userName` and renders a user menu. We add `OrgSwitcher` in the flex row between the spacer (`flex-1`) and the user menu button, visible only when `role === 'super_admin'`.

- [ ] **Step 1: Update `header.tsx`**

Add import at the top of `components/layout/header.tsx`:

```ts
import { OrgSwitcher } from "./org-switcher";
```

Add `role` to the destructured `useAuth()` call:

```ts
const { signOut, role } = useAuth();
```

Add `<OrgSwitcher />` inside the header, between `<div className="flex-1" />` and the user menu `<div className="relative ...">`:

```tsx
<div className="flex-1" />
{role === "super_admin" && <OrgSwitcher />}
<div className="relative flex items-center gap-2">
```

- [ ] **Step 2: Verify the app compiles**

```bash
cd /home/juanda/cobradiario && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/layout/header.tsx
git commit -m "feat: render OrgSwitcher in header for super_admin"
```

---

## Task 5: Update `caja/page.tsx` to use `effectiveOrgId`

**Files:**
- Modify: `app/app/caja/page.tsx`

### Context

The page currently does:
```ts
const { orgId } = useAuth();
const { data: resumen, isLoading, refetch } = useCajaResumen(today, { enabled: !!orgId });
if (!orgId) { return <error message> }
```

Replace `orgId` with `effectiveOrgId` and remove the guard block.

- [ ] **Step 1: Update the destructure and query**

In `app/app/caja/page.tsx`, in `CajaPage`:

Replace:
```ts
const { orgId } = useAuth();
const { data: resumen, isLoading, refetch } = useCajaResumen(today, { enabled: !!orgId });

if (!orgId) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Caja Diaria</h1>
      <p className="text-sm text-muted-foreground">
        Esta vista requiere una organización seleccionada.
      </p>
    </div>
  );
}
```

With:
```ts
const { effectiveOrgId } = useAuth();
const { data: resumen, isLoading, refetch } = useCajaResumen(today, { enabled: !!effectiveOrgId });
```

- [ ] **Step 2: Verify the app compiles**

```bash
cd /home/juanda/cobradiario && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/app/caja/page.tsx
git commit -m "fix: use effectiveOrgId in CajaPage so super_admin can access it"
```

---

## Task 6: Update `ruta/page.tsx` to use `effectiveOrgId`

**Files:**
- Modify: `app/app/ruta/page.tsx`

### Context

The ruta page reads `orgId` at line 57:
```ts
const { orgId } = useAuth();
const { data: rawItems = [], isLoading } = useRutaHoy(undefined, { enabled: !!orgId });
```

- [ ] **Step 1: Replace `orgId` with `effectiveOrgId`**

In `app/app/ruta/page.tsx`, locate the two lines above and replace:

```ts
const { role } = useAuth();
// becomes:
const { role, effectiveOrgId } = useAuth();
```

And:

```ts
const { orgId } = useAuth();
const { data: rawItems = [], isLoading } = useRutaHoy(undefined, { enabled: !!orgId });
// becomes:
const { data: rawItems = [], isLoading } = useRutaHoy(undefined, { enabled: !!effectiveOrgId });
```

Note: `ruta/page.tsx` calls `useAuth()` twice (lines 47 and 57). Merge them into a single destructure at whichever call comes first:

```ts
const { role, effectiveOrgId } = useAuth();
```

Remove the second `useAuth()` call.

- [ ] **Step 2: Verify the app compiles**

```bash
cd /home/juanda/cobradiario && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/app/ruta/page.tsx
git commit -m "fix: use effectiveOrgId in RutaPage so super_admin can access it"
```

---

## Task 7: Cleanup — remove debug log from `/api/auth/me`

**Files:**
- Modify: `app/api/auth/me/route.ts`

- [ ] **Step 1: Remove the console.log line**

In `app/api/auth/me/route.ts`, remove this line (added during debugging):

```ts
console.log("[/api/auth/me] actor:", JSON.stringify(actor), "response status:", response?.status);
```

The file should revert to:

```ts
export async function GET() {
  const { actor, response } = await requireApiActor();
  if (response) return response;
  // ... rest unchanged
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/me/route.ts
git commit -m "chore: remove debug log from /api/auth/me"
```

---

## Task 8: End-to-end verification

No new code. Manual smoke test to confirm the full flow works.

- [ ] **Step 1: Start the dev server (if not running)**

```bash
cd /home/juanda/cobradiario && npm run dev
```

- [ ] **Step 2: Log in as super admin**

Open `http://localhost:3000/login` and log in with `super@credicontrol.test`.

Expected: header shows the `OrgSwitcher` with label "Seleccionar org".

- [ ] **Step 3: Select an organization**

Click the org switcher, pick "CROBRANZAS BOSCONIA".

Expected: label updates to "CROBRANZAS BOSCONIA".

- [ ] **Step 4: Verify Caja Diaria loads**

Navigate to `http://localhost:3000/app/caja`.

Expected: caja page loads with data (or "Sin pagos registrados hoy" if there are none). No "Esta vista requiere una organización" message.

- [ ] **Step 5: Verify Ruta loads**

Navigate to `http://localhost:3000/app/ruta`.

Expected: ruta page loads. No blocking error.

- [ ] **Step 6: Switch org and verify data changes**

Go back to the org switcher, pick a different org (e.g. "Préstamos La Esperanza").

Expected: caja and ruta data reflect the newly selected org.

- [ ] **Step 7: Verify regular admin is unaffected**

Log out, log in as `aquilarjuan123@gmail.com`.

Expected: no org switcher in header, all pages work as before.

- [ ] **Step 8: Run full test suite one final time**

```bash
cd /home/juanda/cobradiario && npx vitest run
```

Expected: all tests pass.
