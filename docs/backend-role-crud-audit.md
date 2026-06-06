# Backend Role CRUD Audit

## Roles

- `super_admin`: administra tenants y puede operar globalmente cuando el endpoint lo permite.
- `admin`: administra datos dentro de su `organization_id`.
- `cobrador`: opera cartera/ruta/caja asignada.

## Estado De Credenciales

| Rol | Email | Estado |
| --- | --- | --- |
| super_admin | `super@credicontrol.test` | Usuario confirmado, perfil activo, requiere password reset seguro por Auth Admin/Dashboard |
| admin | `admin-a@credicontrol.test` | Usuario confirmado, perfil activo |
| cobrador | `cobrador-a1@credicontrol.test` | Usuario confirmado, perfil activo |

Password seed verificado para smoke tests: `Password123!`. Rotar antes de producción.

## Matriz CRUD Por Rol

| Module | Endpoint | Method | super_admin | admin | cobrador | Expected behavior | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | `/api/auth/me` | GET | allow | allow | allow | Return actor/profile | Pending HTTP session test |
| Clientes | `/api/clientes` | GET | allow | allow own org | allow own org | List filtered clients | Pending HTTP session test |
| Clientes | `/api/clientes` | POST | allow | allow own org | deny | Create client | Pending HTTP session test |
| Clientes | `/api/clientes/:id` | GET | allow | allow own org | allow own org | Read client | Pending HTTP session test |
| Clientes | `/api/clientes/:id` | PATCH | allow | allow own org | deny | Update client | Pending HTTP session test |
| Clientes | `/api/clientes/:id` | DELETE | allow | allow own org | deny | Soft delete client | Pending HTTP session test |
| Prestamos | `/api/prestamos` | GET | allow | allow own org | allow assigned | List loans | Pending HTTP session test |
| Prestamos | `/api/prestamos` | POST | allow | allow own org | deny | Create loan and schedule | Pending HTTP session test |
| Prestamos | `/api/prestamos/:id` | GET | allow | allow own org | allow assigned | Read loan | Pending HTTP session test |
| Prestamos | `/api/prestamos/:id/cronograma` | GET | allow | allow own org | allow assigned | Read schedule | Pending HTTP session test |
| Prestamos | `/api/prestamos/:id/cancelar` | POST | allow | allow own org | deny | Cancel loan | Pending HTTP session test |
| Prestamos | `/api/prestamos/:id/refinanciar` | POST | allow | allow own org | deny | Refinance loan | Pending HTTP session test |
| Pagos | `/api/pagos` | GET | allow | allow own org | allow assigned | List payments | Pending HTTP session test |
| Pagos | `/api/pagos` | POST | allow | allow own org | allow assigned | Register payment via `register_payment` | Pending HTTP session test |
| Pagos | `/api/pagos/:id/comprobante` | GET | allow | allow own org | allow assigned | Payment receipt | Pending HTTP session test |
| Ruta | `/api/ruta/hoy` | GET | allow | allow own org | allow assigned | Today's route | Pending HTTP session test |
| Ruta | `/api/ruta/visitas` | POST | allow | allow own org | allow assigned | Register visit | Pending HTTP session test |
| Caja | `/api/caja/resumen` | GET | allow | allow own org | allow assigned | Cash summary | Pending HTTP session test |
| Caja | `/api/caja/historial` | GET | allow | allow own org | allow assigned | Cash history | Pending HTTP session test |
| Caja | `/api/caja/cierre-ruta` | POST | allow | allow own org | allow assigned | Route closing | Pending HTTP session test |
| Caja | `/api/caja/cierre-general` | POST | allow | allow own org | deny | General closing | Pending HTTP session test |
| Mora | `/api/mora` | GET | allow | allow own org | allow own org | Mora list | Pending HTTP session test |
| Mora | `/api/mora/:id/pago` | POST | allow | allow own org | deny | Pay mora | Pending HTTP session test |
| Mora | `/api/mora/:id/condonar` | POST | allow | allow own org | deny | Forgive mora | Pending HTTP session test |
| Reportes | `/api/reportes/resumen` | GET | allow | allow own org | deny | Summary report | Pending HTTP session test |
| Reportes | `/api/reportes/proyeccion` | GET | allow | allow own org | deny | Projection report | Pending HTTP session test |
| Reportes | `/api/reportes/cobradores` | GET | allow | allow own org | deny | Collector report | Pending HTTP session test |
| Reportes | `/api/reportes/cartera-riesgo` | GET | allow | allow own org | deny | Risk portfolio report | Pending HTTP session test |
| Reportes | `/api/reportes/export` | GET | allow | allow own org | deny | Export report | Pending HTTP session test |
| Super Admin | `/api/super-admin/tenants` | GET | allow | deny | deny | List tenants | Pending HTTP session test |
| Super Admin | `/api/super-admin/tenants` | POST | allow | deny | deny | Create tenant | Pending HTTP session test |
| Super Admin | `/api/super-admin/tenants/:id` | GET | allow | deny | deny | Read tenant | Pending HTTP session test |
| Super Admin | `/api/super-admin/tenants/:id` | PATCH | allow | deny | deny | Update tenant | Pending HTTP session test |
| Super Admin | `/api/super-admin/tenants/:id/activar` | POST | allow | deny | deny | Activate tenant | Pending HTTP session test |
| Super Admin | `/api/super-admin/tenants/:id/suspender` | POST | allow | deny | deny | Suspend tenant | Pending HTTP session test |
| Super Admin | `/api/super-admin/tenants/:id/extender-periodo` | POST | allow | deny | deny | Extend trial | Pending HTTP session test |
| Super Admin | `/api/super-admin/metricas` | GET | allow | deny | deny | Platform metrics | Pending HTTP session test |

## Database Verification Completed

- Extra RPC overloads removed for `audit_action` and `register_payment`.
- `idx_clientes_nombre_trgm` exists on `public.clientes`.
- `audit_logs` policies are restricted to `authenticated`.
- `custom_access_token_hook` and `handle_new_user` are not executable by `PUBLIC`, `anon`, or `authenticated`.
- RLS helper functions moved out of exposed `public` RPC surface into private schema helpers.
- Missing FK indexes reported by Supabase performance advisor were added.
- Duplicate indexes reported by Supabase performance advisor were removed.
- Multiple permissive `SELECT` policies from `ALL` write policies were split into explicit insert/update/delete policies.
- Auth/helper calls in RLS policies were rewritten with initplan-safe `(select ...)` patterns.

## REST/RLS Smoke Evidence

Executed against Supabase REST with real Auth tokens on 2026-06-05:

```json
{
  "super_login": true,
  "admin_login": true,
  "cobrador_login": true,
  "super_orgs": 4,
  "admin_clientes": 3,
  "cobrador_prestamos": 1,
  "cobrador_client_insert": "denied_403",
  "cobrador_payment_rpc": "ok_933905bd-3162-4f5b-836b-b6889cd8ad13"
}
```

Advisor evidence after fixes:

- Security: only `auth_leaked_password_protection` remains; it requires Dashboard configuration.
- Performance: actionable `unindexed_foreign_keys`, `auth_rls_initplan`, `multiple_permissive_policies`, and `duplicate_index` findings cleared.
- Performance still reports `unused_index` INFO findings; these were not dropped because several are newly created or intentionally low-traffic indexes.

## Open Blocker

- Full Next.js `app/api/**` HTTP session tests still require browser/SSR cookie sessions. Bearer-token REST/RLS tests passed, but they do not exercise the cookie-based route layer.
- Dashboard actions remain: enable Custom Access Token Hook, enable Leaked Password Protection, and rotate seed passwords before production.
