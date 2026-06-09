# Super Admin: Org Selector

**Date:** 2026-06-09
**Status:** Approved

## Problem

The `super_admin` role has no `organization_id` in its JWT. Every module either blocks with "Esta vista requiere una organización seleccionada" or returns 403 on writes. The super admin cannot operate any module.

## Goal

Super admin can select an active organization from the header and administer it through every existing module — reads, writes, caja, reportes — identical to how a regular admin operates their own org.

## Architecture

### Data flow

```
super admin selects org
        ↓
setActiveOrgId(id)
        ↓
  localStorage  +  cookie active-org-id (path=/, SameSite=Strict)
        ↓
auth context: effectiveOrgId = orgId ?? activeOrgId
        ↓
pages/hooks use effectiveOrgId → queries enabled
        ↓
HTTP request carries cookie automatically
        ↓
requireApiActor: role=super_admin + orgId=null → read cookie → actor.organizationId = cookie value
        ↓
all existing API endpoints work unchanged
```

### Key invariant

`effectiveOrgId` is always the source of truth on the client. It equals `orgId` for regular users (no behavior change) and `activeOrgId` for super admin (new behavior). No page or hook needs to know which role is active.

## Components

### `providers/auth-provider.tsx` (modified)

Add to `AuthContextValue`:
- `activeOrgId: string | null` — super admin's selected org, loaded from `localStorage('active-org-id')` on init
- `effectiveOrgId: string | null` — `orgId ?? activeOrgId`
- `setActiveOrgId: (id: string) => void` — persists to state, `localStorage`, and cookie `active-org-id`

Cookie spec: `name=active-org-id; path=/; SameSite=Strict; Max-Age=604800` (7 days), set via `document.cookie`.

### `components/layout/org-switcher.tsx` (new)

Compact dropdown rendered in the header, visible only when `role === 'super_admin'`.

- Fetches org list from `/api/super-admin/organizations`
- Shows active org name or "Seleccionar organización" placeholder
- On selection: calls `setActiveOrgId(org.id)`
- Design: matches existing header style (no custom styling)

### `app/api/super-admin/organizations/route.ts` (new)

```
GET /api/super-admin/organizations
Auth: requireApiActor(['super_admin'])
Returns: { data: Array<{ id, nombre_negocio, ciudad, estado_suscripcion }> }
```

No org filter applied — returns all rows from `organizations`.

### `lib/api/auth.ts` (modified)

After the existing role/org fallback from profile, add:

```ts
if (actor.role === 'super_admin' && !actor.organizationId) {
  const reqHeaders = await headers(); // from 'next/headers'
  const cookieStore = await cookies(); // from 'next/headers'
  const activeOrgId = cookieStore.get('active-org-id')?.value ?? null;
  if (activeOrgId) actor.organizationId = activeOrgId;
}
```

This is the only server-side change. All existing API routes continue unchanged.

### `components/layout/header.tsx` (modified)

Add `<OrgSwitcher />` inside the header, conditionally rendered when `role === 'super_admin'`.

### Pages and hooks (modified)

Replace every occurrence of `orgId` from `useAuth()` with `effectiveOrgId`:

| File | Change |
|------|--------|
| `app/app/caja/page.tsx` | `orgId` → `effectiveOrgId`; remove `if (!orgId)` guard |
| `app/app/ruta/page.tsx` | `orgId` → `effectiveOrgId` |
| `app/app/configuracion/page.tsx` | uses `me.organization` via `/api/auth/me` — already works |
| All hooks with `enabled: !!orgId` | `!!orgId` → `!!effectiveOrgId` |

### `app/api/auth/me/route.ts` (modified)

Remove the temporary `console.log` added during debugging.

## Security

- The cookie is only consumed when `role === 'super_admin'`. A regular admin cannot elevate their org scope by setting the cookie — their org comes from the JWT and profile, not the cookie.
- The cookie value (a UUID) is not validated against a whitelist. If the UUID doesn't match any org, Supabase queries return empty results — no data leak, no error.
- `/api/super-admin/organizations` requires `super_admin` role — regular admins cannot list all orgs.

## Files changed

| File | Action |
|------|--------|
| `providers/auth-provider.tsx` | Add `activeOrgId`, `effectiveOrgId`, `setActiveOrgId` |
| `components/layout/org-switcher.tsx` | New component |
| `components/layout/header.tsx` | Render `<OrgSwitcher />` |
| `app/api/super-admin/organizations/route.ts` | New route |
| `lib/api/auth.ts` | Read `active-org-id` cookie for super_admin |
| `app/api/auth/me/route.ts` | Remove debug log |
| `app/app/caja/page.tsx` | Use `effectiveOrgId`, remove guard |
| `app/app/ruta/page.tsx` | Use `effectiveOrgId` |
| All hooks using `orgId` | Replace with `effectiveOrgId` |

## Out of scope

- Super admin creating new organizations (handled elsewhere)
- Switching orgs mid-session invalidating in-flight requests (acceptable race condition — next request picks up the new cookie)
- Impersonation of specific users within an org
