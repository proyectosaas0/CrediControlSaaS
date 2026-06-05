# Backend de Fundación CrédiControl — Guía de Operación

Esta guía cubre cómo instalar, configurar y operar el backend multi-tenant de CrédiControl en Supabase.

## Requisitos Previos

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env` y rellena las credenciales desde el Dashboard de Supabase:

```bash
cp .env.example .env
```

Las claves requeridas son:
- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto (ej: `https://aamfmqhhmuwnyqdsqklr.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima publicable (Project Settings → API → `anon` key)
- `SUPABASE_SERVICE_ROLE_KEY`: Clave de service role para operaciones administrativas (Project Settings → API → `service_role` key)

**Advertencia:** `.env` no se commitea. Nunca expongas estas claves en repositorios públicos.

### 2. Vincular el Proyecto Remoto

Ejecuta:

```bash
npx supabase link --project-ref aamfmqhhmuwnyqdsqklr
```

El CLI solicitará el access token o contraseña de la base de datos. Una vez vinculado, `npm run db:push` aplicará las migraciones al proyecto remoto.

---

## Puesta en Marcha (Orden Completo)

Sigue estos pasos en orden **exacto** para una puesta en marcha correcta:

### 1. Aplicar Migraciones

```bash
npm run db:push
```

Esto aplica las 5 migraciones en orden:

| Migración | Propósito |
|-----------|-----------|
| `0001_schema.sql` | Crea las 7 tablas (`organizations`, `profiles`, `clientes`, `prestamos`, `cronograma_pagos`, `mora_registros`, `cierres_caja`), enums, índices y foreign keys. |
| `0002_helpers.sql` | Crea funciones SQL auxiliares (`current_org_id()`, `current_rol()`, `is_super_admin()`) que leen los claims del JWT. |
| `0003_rls.sql` | Habilita y fuerza Row Level Security (RLS) en todas las 7 tablas. Define las políticas de acceso por rol y organización. |
| `0004_auth_hook.sql` | Define la función `custom_access_token_hook` que inyecta `rol` y `organization_id` en los claims del JWT. |
| `0005_signup_trigger.sql` | Crea el trigger `handle_new_user` que al registrarse un usuario crea su organización (si es prestamista) o lo añade a la organización existente (si es cobrador). |

**Salida esperada:** Sin errores, las migraciones se aplican de forma idempotente.

### 2. **PASO MANUAL OBLIGATORIO — Habilitar el Auth Hook**

**Sin este paso, los tests fallarán y RLS denegará todo.**

En el Dashboard de Supabase, ve a:
- **Authentication → Hooks (Beta) → Custom Access Token**
- Habilita el toggle.
- Apunta la URI a: `public.custom_access_token_hook`
- Guarda los cambios.

**¿Qué sucede sin este paso?**
- Los JWT se emiten SIN los claims `rol` y `organization_id`.
- Las funciones auxiliares `current_org_id()` y `current_rol()` devuelven `null`.
- RLS deniega todos los accesos (fail-closed).
- Los tests no pasarán.

**Verificación:** Tras hacer el seed, inicia sesión como un usuario y decodifica el `access_token` en [jwt.io](https://jwt.io). Debe contener `"rol"` y `"organization_id"` en el payload.

### 3. Regenerar Tipos TypeScript

```bash
npm run gen:types
```

Esto genera `lib/database.types.ts` con los tipos TS a partir del esquema remoto. Este archivo es **provisional** hasta que lo regeneres con este comando cada vez que cambies el esquema.

**Salida esperada:** Genera `lib/database.types.ts` sin errores.

### 4. Sembrar Datos de Prueba

```bash
npm run seed
```

Esto crea usuarios y datos de prueba usando la Auth Admin API (vía `SUPABASE_SERVICE_ROLE_KEY`).

**Usuarios creados:**

| Email | Rol | Organización | Contraseña |
|-------|-----|--------------|-----------|
| `super@credicontrol.test` | `super_admin` | Ninguna (global) | `Password123!` |
| `admin-a@credicontrol.test` | `admin` | Préstamos La Esperanza (Valledupar) | `Password123!` |
| `admin-b@credicontrol.test` | `admin` | Crédito Rápido B (Bogotá) | `Password123!` |
| `cobrador-a1@credicontrol.test` | `cobrador` | Préstamos La Esperanza | `Password123!` |
| `cobrador-a2@credicontrol.test` | `cobrador` | Préstamos La Esperanza | `Password123!` |
| `cobrador-b1@credicontrol.test` | `cobrador` | Crédito Rápido B | `Password123!` |

**Datos asociados:**
- Organización A: 3 clientes + 2 préstamos + 2 cronogramas de pago.
- Organización B: 2 clientes + 1 préstamo + 1 cronograma de pago.

**Nota de idempotencia:** Re-sembrar con usuarios que ya existen fallará (`createUser` rechaza emails duplicados). Para re-sembrar en desarrollo:

```bash
npm run db:reset  # ⚠️ Solo entornos NO productivos
npm run seed
```

### 5. Correr las Pruebas

```bash
npm test
```

Ejecuta `vitest run` con los tests de aislamiento RLS (`tests/rls-isolation.test.ts`).

**Tests incluidos:**
- `admin de A no ve préstamos de B`: Verifica aislamiento por organización.
- `admin de A ve 0 clientes de la cédula de B`: RLS filtra entre organizaciones.
- `cobrador A1 solo ve préstamos asignados a él`: RLS filtra por `cobrador_id`.
- `cobrador A1 NO puede insertar un préstamo`: Insert policy rechaza a cobradores.
- `super_admin ve datos de A y de B`: Super admin bypassa restricciones.
- `cliente sin autenticación no obtiene filas`: Usuarios no autenticados obtienen `[]`.

**Salida esperada:** Los 6 tests pasan. Si alguno falla por claims ausentes, revisa que el paso 2 (habilitar el hook) esté completado.

**Ejecución en modo watch (desarrollo):**

```bash
npm run test:watch
```

---

## Comandos de Referencia

| Comando | Propósito |
|---------|-----------|
| `npm run db:push` | Aplica todas las migraciones pendientes al proyecto remoto. |
| `npm run db:reset` | Resetea la BD remota (solo desarrollo — DESTRUYE datos). |
| `npm run gen:types` | Regenera `lib/database.types.ts` desde el esquema remoto. |
| `npm run seed` | Crea usuarios y datos de prueba. Idempotente solo si no existen. |
| `npm test` | Ejecuta las pruebas de RLS una vez. |
| `npm run test:watch` | Ejecuta las pruebas en modo watch (desarrollo). |

---

## Resolución de Problemas

### Los tests fallan con "permission denied" o filas vacías

**Causa:** El auth hook no está habilitado (Paso 2).
**Solución:** Habilita el auth hook en el Dashboard (Authentication → Hooks → Custom Access Token).

### `npm run db:push` falla con "not linked"

**Causa:** El proyecto no está vinculado.
**Solución:** Ejecuta `npx supabase link --project-ref aamfmqhhmuwnyqdsqklr`.

### `npm run seed` falla con "duplicate key value violates unique constraint"

**Causa:** Los usuarios ya existen (seed no es idempotente si los usuarios persisten).
**Solución:** Opción A (desarrollo): `npm run db:reset && npm run seed`. Opción B (production): borra manualmente los usuarios en el Dashboard (Authentication → Users).

### Los tipos TS están desactualizados

**Causa:** El esquema cambió pero `lib/database.types.ts` no se regeneró.
**Solución:** `npm run gen:types` después de cada cambio de esquema.

### "NEXT_PUBLIC_SUPABASE_URL not found"

**Causa:** Las variables de `.env` no se cargan.
**Solución:** Verifica que existe `.env` y contiene las claves. Si usas `npm run seed` o tests, `dotenv` debe cargar el archivo (el `vitest.config.ts` lo hace automáticamente).

---

## Arquitectura Resumen

- **7 tablas** con RLS forzado: `organizations`, `profiles`, `clientes`, `prestamos`, `cronograma_pagos`, `mora_registros`, `cierres_caja`.
- **Roles:** `super_admin`, `admin`, `cobrador`. Los claims se inyectan en JWT vía auth hook.
- **Aislamiento:** Cada tabla indexa `organization_id` y RLS filtra por los claims `organization_id` y `rol` del usuario.
- **Trigger:** Al registrarse, crea org+admin (prestamista) o solo profile (cobrador invitado).
- **Clientes:** `@supabase/ssr` en Next.js 16. Middleware refresca sesión; helpers en `lib/auth.ts` exponen `getUser()`, `getRole()`, `getOrgId()`, `requireRole()`.

---

## Referencias

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-custom-claims)
- [Next.js 16 + @supabase/ssr](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
