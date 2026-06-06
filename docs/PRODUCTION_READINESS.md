# PRODUCCION - CHECKLIST FINAL

**Estado:** BLOQUEADO - requiere verificacion/correccion de migracion remota  
**Fecha:** 2026-06-05  
**Versión:** v1.0

---

## BLOQUEADORES DETECTADOS

- `production_security_hardening` fue aplicado remotamente, pero no existe como archivo en `supabase/migrations/`; el historial local no reproduce produccion.
- `lib/database.types.ts` quedo vacio tras el primer intento de generacion; fue restaurado desde el archivo temporal de Copilot, pero debe regenerarse con el CLI en un entorno con dependencias instaladas.
- La migracion aplicada agrego overloads de `audit_action` y `register_payment` que no son las firmas usadas por la app; deben verificarse en PostgREST para evitar llamadas RPC ambiguas o funciones publicas innecesarias.
- `drop extension if exists pg_trgm cascade` puede haber eliminado indices trigram, incluyendo busqueda por nombre de clientes; hay que confirmar y recrear indices afectados.
- Las funciones `SECURITY DEFINER` en `public` deben tener grants revisados; no deben quedar ejecutables por `anon`, `authenticated` o `PUBLIC` salvo necesidad explicita.

---

## ✅ COMPLETADO EN BASE DE DATOS

### 1. **Security Hardening** 🔒
- [x] Todas las funciones tienen `SET search_path = 'public'` (10 funciones corregidas)
- [x] `pg_trgm` extension movida a schema `extensions`
- [x] RLS policies para `audit_logs` restringidas (INSERT: solo `actor_id = auth.uid()`)
- [x] Función `handle_new_user()` revocada de roles `anon/authenticated`
- [x] Custom Access Token Hook configurado en código

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

### 3. **Schema & Migrations** 📊
- [x] 12 migraciones aplicadas
- [x] RLS habilitado en todas las tablas (16 tablas)
- [x] 8 usuarios con perfiles válidos
- [x] Todos los usuarios con `rol` y `activo = true`

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

- [ ] Custom Access Token Hook habilitado
- [ ] Leaked Password Protection habilitada
- [ ] Usuarios han cerrado sesión
- [ ] JWT incluye `rol` y `organization_id`
- [ ] RLS activo (test: intentar SELECT sin rol correcto = error)
- [ ] Índices creados
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

**Migración:** `production_security_hardening`

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
**Próximo paso:** Auditar la base remota y crear una migracion correctiva trazable
