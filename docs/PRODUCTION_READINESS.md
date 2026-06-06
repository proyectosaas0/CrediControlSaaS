# PRODUCCION - CHECKLIST FINAL

**Estado:** BLOQUEADO - requiere acciones manuales de Dashboard y pruebas HTTP con cookies SSR  
**Fecha:** 2026-06-05  
**Versión:** v1.0

---

## BLOQUEADORES RESTANTES

- Habilitar **Custom Access Token Hook** en Supabase Dashboard para que nuevos JWT incluyan `rol` y `organization_id`.
- Habilitar **Leaked Password Protection** en Supabase Dashboard.
- Rotar la contraseña seed `Password123!` antes de producción.
- Completar pruebas HTTP reales contra `app/api/**` usando cookies SSR de Supabase; las pruebas REST/RLS con Bearer token ya pasaron.

---

## ✅ COMPLETADO EN BASE DE DATOS

### 1. **Security Hardening** 🔒
- [x] Todas las funciones tienen `SET search_path = 'public'` (10 funciones corregidas)
- [x] `pg_trgm` extension movida a schema `extensions`
- [x] RLS policies para `audit_logs` restringidas (INSERT: solo `actor_id = auth.uid()`)
- [x] Función `handle_new_user()` revocada de roles `anon/authenticated`
- [x] Custom Access Token Hook configurado en código
- [x] Helpers RLS `current_org_id`, `current_rol`, `is_super_admin` movidos fuera del schema `public` expuesto
- [x] Overloads obsoletos de `audit_action` y `register_payment` eliminados

### 2. **Performance** ⚡
- [x] 8 índices creados para foreign keys críticas:
  - `idx_cierres_caja_cerrado_por`
  - `idx_cronograma_pagos_cobrador_id`
  - `idx_prestamos_cobrador_id`
  - `idx_prestamos_cliente_id`
  - `idx_prestamos_organization_id`
  - `idx_pagos_prestamo_id`
  - `idx_clientes_organization_id`
  - `idx_profiles_organization_id`
- [x] Índices FK adicionales creados según Supabase advisor para `mora_registros`, `pagos`, `prestamos`, `subscription_payments`, `tenant_subscriptions` y `visitas_cobro`
- [x] Índices duplicados reportados por advisor eliminados
- [x] Políticas RLS optimizadas para evitar `auth_rls_initplan` y múltiples políticas permisivas de lectura

### 3. **Schema & Migrations** 📊
- [x] 12 migraciones aplicadas
- [x] Migraciones correctivas locales creadas en `supabase/migrations/`
- [x] RLS habilitado en todas las tablas (16 tablas)
- [x] 8 usuarios con perfiles válidos
- [x] Todos los usuarios con `rol` y `activo = true`

### 4. **Verificación 2026-06-05**
- [x] Smoke REST/RLS con tokens reales:
  - `super_login=true`
  - `admin_login=true`
  - `cobrador_login=true`
  - `super_orgs=4`
  - `admin_clientes=3`
  - `cobrador_prestamos=1`
  - `cobrador_client_insert=denied_403`
  - `cobrador_payment_rpc=ok_933905bd-3162-4f5b-836b-b6889cd8ad13`
- [x] Security advisor: solo queda `auth_leaked_password_protection`, que requiere Dashboard.
- [x] Performance advisor: corregidos `unindexed_foreign_keys`, `auth_rls_initplan`, `multiple_permissive_policies` y `duplicate_index`.
- [ ] Performance advisor: quedan `unused_index` INFO; no se eliminaron por falta de tráfico suficiente y porque varios índices son nuevos o intencionales.

---

## ⚠️ MANUAL ACTIONS - SUPABASE DASHBOARD

**Estas acciones NO se pueden automatizar. Debes hacerlas en el Dashboard:**

### PASO 1: Habilitar Custom Access Token Hook
1. Abre: `https://aamfmqhhmuwnyqdsqklr.supabase.co`
2. Ve a: **Auth → Hooks**
3. Busca o crea: **Custom Access Token**
4. Configura:
   - **Type:** Custom Access Token
   - **Schema:** public
   - **Function:** `custom_access_token_hook`
   - **Estado:** ✅ Enabled
5. **Guarda** los cambios

### PASO 2: Habilitar Leaked Password Protection
1. Ve a: **Auth → Password Security**
2. Busca: **Leaked Password Protection**
3. **Habilita** (toggle ON)
4. **Guarda**

### PASO 3: Invalidar Sesiones Existentes
Todos los usuarios DEBEN cerrar sesión y volver a iniciar para recibir JWT con claims actualizados.

```bash
# Ejecuta en Dashboard → SQL Editor para limpiar sesiones viejas (OPCIONAL)
update auth.sessions set revoked_at = now() where revoked_at is null;
```

---

## 🔍 VERIFICACIÓN POST-DEPLOYMENT

Después de completar los pasos manuales, ejecuta estas verificaciones:

### ✓ Verificar que Custom Access Token está activo
```sql
-- Ejecuta en Supabase SQL Editor
-- El JWT de cualquier usuario nuevo debe incluir 'rol' y 'organization_id'
select
  auth.jwt()->>'sub' as user_id,
  auth.jwt()->>'rol' as rol,
  auth.jwt()->>'organization_id' as org_id
from auth.users
where email = 'admin-a@credicontrol.test'
limit 1;
```

**Resultado esperado:**
```
user_id              | rol   | org_id
--------------------|-------|----------------------------------
107d54d6-3979...     | admin | ba134dd3-c9fe-4123-8cb3-...
```

### ✓ Verificar RLS activo
```sql
-- Debe bloquear acceso sin rol
select * from public.prestamos limit 1;  -- Falla si RLS es correcto
```

### ✓ Verificar índices
```sql
select schemaname, tablename, indexname 
from pg_indexes 
where schemaname = 'public' 
  and indexname like 'idx_%'
order by indexname;
```

---

## 🐛 Troubleshooting

### Problema: "Rol no autorizado" aún después de habilitar hook
**Causa:** Custom Access Token Hook no está habilitado o JWT está cacheado.

**Solución:**
1. Verifica que esté en estado "Enabled" en Dashboard
2. Usuario debe cerrar sesión completamente
3. Borrar cookies del navegador
4. Volver a iniciar sesión (fuerza renovación del JWT)

### Problema: RLS bloqueando operaciones válidas
**Causa:** Claims vacíos en JWT o política RLS demasiado restrictiva.

**Solución:**
- Verifica que el usuario tiene perfil activo: `select * from public.profiles where id = 'user-id'`
- Revisa el JWT: `select auth.jwt() from auth.users where id = 'user-id'`
- Revisa logs: Dashboard → Auth → Logs

---

## 📋 Checklist Pre-Deployment

- [ ] Custom Access Token Hook habilitado en Dashboard
- [ ] Leaked Password Protection habilitada en Dashboard
- [ ] Passwords seed rotados
- [ ] Usuarios han cerrado sesión
- [ ] JWT incluye `rol` y `organization_id`
- [ ] RLS activo (test: intentar SELECT sin rol correcto = error)
- [ ] Índices creados
- [ ] Pruebas HTTP `app/api/**` ejecutadas con cookies SSR reales
- [ ] Sin errores en logs de Postgres
- [ ] Connection pooling configurado (si aplica)
- [ ] Backups automáticos habilitados
- [ ] Monitoring activo

---

## 📚 Documentación Relacionada

- [SECURITY.md](./SECURITY.md) - Políticas RLS detalladas
- [DATABASE.md](./DATABASE.md) - Esquema de datos
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de deployment
- [MONITORING.md](./MONITORING.md) - Alertas y monitoreo

---

## 🎯 Resumen de Cambios

**Migraciones correctivas principales:**

- `20260605_backend_roles_hardening.sql`
- `20260605_audit_logs_policy_cleanup.sql`
- `20260605_rls_helpers_profile_fallback.sql`
- `20260605_payment_rls_cleanup.sql`
- `20260605_register_payment_audit_cast.sql`
- `20260605_audit_action_search_path.sql`
- `20260605_rls_private_helpers_and_index_cleanup.sql`
- `20260605_grant_private_rls_helpers_to_anon.sql`

```sql
-- Funciones auditadas
CREATE OR REPLACE FUNCTION public.current_org_id() ... SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.current_rol() ... SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.is_super_admin() ... SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.custom_access_token_hook() ... SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.audit_action() ... SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.register_payment() ... SET search_path = 'public'

-- RLS para audit_logs
CREATE POLICY audit_logs_insert_authenticated ... (actor_id = auth.uid())
CREATE POLICY audit_logs_select_own_org ... (org match + super_admin)

-- Índices de performance
8x CREATE INDEX idx_*

-- Extension
DROP EXTENSION pg_trgm FROM public; CREATE EXTENSION pg_trgm IN extensions;

-- Seguridad
REVOKE execute handle_new_user() FROM anon, authenticated, public
```

---

## ❓ Preguntas Frecuentes

**P:** ¿Es obligatorio habilitar Leaked Password Protection?  
**R:** Recomendado para producción. Integra con HaveIBeenPwned para bloquear contraseñas comprometidas.

**P:** ¿Qué pasa si olvido invalidar sesiones?  
**R:** Los usuarios existentes mantendrán JWT sin claims. Deberán cerrar sesión manualmente.

**P:** ¿Los índices afectan escrituras?  
**R:** Ligeramente. Pero el beneficio de performance en lecturas es mucho mayor.

---

**Status:** BLOQUEADO  
**Próximo paso:** completar acciones manuales de Dashboard y pruebas HTTP con cookies SSR reales
