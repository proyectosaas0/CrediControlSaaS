# CrédiControl SaaS — Propuesta de Frontend

**Versión:** 1.0  
**Fecha:** Junio 2026  
**Autor:** Generado a partir del análisis completo del proyecto (SRS v1, migraciones DB, API routes existentes, dominio)  
**Alcance:** Propuesta de arquitectura, diseño y plan de implementación para la capa de presentación. No modifica código funcional, backend ni migraciones.

---

## 1. Resumen Ejecutivo

CrédiControl es un SaaS de cobranza diaria para prestamistas informales en Colombia/LATAM. El backend ya está operativo: 6 migraciones desplegadas (12+ tablas, RLS, auth hook, signup trigger), 30 API routes funcionales, lógica de dominio (cálculos financieros, mora, WhatsApp) y suite de tests. La capa de presentación es el vacío crítico: actualmente solo existe el boilerplate de `create-next-app`.

Esta propuesta define cómo construir la UI alineada con el SRS, el esquema DB real, los endpoints existentes y los principios de diseño mobile-first que el SRS exige.

---

## 2. Stack Detectado y Decisions de Base

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Framework | Next.js (App Router) | 16.2.7 | Breaking changes vs. Next.js 14 del SRS. Leer `node_modules/next/dist/docs/` |
| UI Runtime | React | 19.2.4 | Breaking changes vs. React 18 |
| Lenguaje | TypeScript | 5.x | Strict mode habilitado |
| Estilos | Tailwind CSS | v4 | CSS-first config (`@import "tailwindcss"`, `@theme inline`), NO `@tailwind` directives v3 |
| Validación | Zod | v4 | Breaking changes vs. Zod v3 (`.safeParse()` compatible, otros métodos difieren) |
| Auth + DB | Supabase SSR + JS | 0.10.3 / 2.107.0 | SSR client, browser client, admin client, middleware |
| Testing | Vitest | 4.1.8 | Node environment, `dotenv/config` setup |
| Linting | ESLint | 9 flat config | `eslint-config-next` core-web-vitals + typescript |
| Fonts | Geist Sans + Geist Mono | next/font/google | Variables CSS `--font-geist-sans`, `--font-geist-mono` |

### Lo que NO está instalado (aún)

- **shadcn/ui**: Mencionado en SRS pero no inicializado. Se propone instalar como sistema de componentes base.
- **React Hook Form** / **@hookform/resolvers**: No instalados. Se proponen para formularios.
- **Chart library**: No hay librería de gráficos. Se propone Recharts (ligero, React-native, SSR-compatible).
- **Date library**: No instalada. Se propone `date-fns` (tree-shakeable, ligero).
- **React Query / TanStack Query**: No instalado. Se propone para caching de server state.
- **Sonner** o **react-hot-toast**: No instalado. Se propone para toasts de feedback.

---

## 3. Arquitectura de Carpetas Frontend

```
app/
├── (auth)/                          # Grupo de rutas: landing + auth (sin layout de dashboard)
│   ├── page.tsx                     # Landing page pública
│   ├── login/page.tsx               # Login
│   ├── register/page.tsx            # Registro prestamista
│   └── verify/page.tsx              # Verificación de correo
│
├── (dashboard)/                     # Grupo de rutas: app autenticada con layout de dashboard
│   ├── layout.tsx                   # Shell: sidebar + header + main
│   ├── page.tsx                     # Dashboard admin/cobrador (role-based)
│   ├── clientes/
│   │   ├── page.tsx                 # Lista de clientes
│   │   └── [id]/page.tsx            # Detalle del cliente
│   ├── prestamos/
│   │   ├── page.tsx                 # Lista de préstamos
│   │   ├── nuevo/page.tsx           # Crear préstamo (3 pasos)
│   │   └── [id]/page.tsx            # Detalle + cronograma + refinanciar
│   ├── ruta/
│   │   └── page.tsx                 # Ruta del día (vista cobrador)
│   ├── pagos/
│   │   └── page.tsx                 # Historial de pagos
│   ├── mora/
│   │   └── page.tsx                 # Panel de mora
│   ├── caja/
│   │   └── page.tsx                 # Caja diaria + cierres
│   ├── reportes/
│   │   └── page.tsx                 # Reportes con filtros
│   ├── cobradores/
│   │   └── page.tsx                 # Gestión de cobradores (admin)
│   ├── configuracion/
│   │   └── page.tsx                 # Settings del tenant
│   └── perfil/
│       └── page.tsx                 # Perfil del usuario
│
├── (super-admin)/                   # Grupo aislado: panel de SocioIA
│   ├── layout.tsx                   # Layout super-admin (sin sidebar de tenant)
│   ├── dashboard/page.tsx           # Métricas globales
│   ├── tenants/
│   │   ├── page.tsx                 # Lista de tenants
│   │   └── [id]/page.tsx            # Detalle del tenant
│   ├── suscripciones/page.tsx       # Gestión de planes
│   └── metricas/page.tsx            # Métricas de producto
│
├── api/                             # API Routes existentes (NO MODIFICAR)
│   └── ...                          # 30 endpoints ya implementados
│
├── layout.tsx                       # Root layout (fonts, globals)
├── globals.css                      # Tailwind v4 + design tokens
└── favicon.ico

lib/
├── supabase/                        # Clientes Supabase existentes
├── server/                          # admin-supabase.ts existente
├── api/                             # errors.ts, validation.ts, auth.ts existentes
├── domain/                          # money.ts, loans.ts, mora.ts, whatsapp.ts, reports.ts
├── auth.ts                          # getUser, getRole, getOrgId, requireRole
└── database.types.ts                # Tipos generados de Supabase

components/
├── ui/                              # Componentes base shadcn/ui
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx                    # Para bottom sheets móviles
│   ├── select.tsx
│   ├── badge.tsx
│   ├── skeleton.tsx
│   ├── toast.tsx                    # Sonner wrapper
│   └── ...
├── layout/
│   ├── sidebar.tsx                  # Sidebar responsivo (oculto en móvil, drawer)
│   ├── header.tsx                   # Header con nombre de usuario + org
│   ├── mobile-nav.tsx               # Bottom navigation bar (cobrador)
│   └── role-gate.tsx                # Renderizado condicional por rol
├── domain/
│   ├── payment-card.tsx             # Tarjeta de cobro para la ruta
│   ├── client-badge.tsx             # Badge de comportamiento (verde/amarillo/rojo)
│   ├── loan-status-badge.tsx        # Badge de estado de préstamo
│   ├── schedule-table.tsx           # Cronograma de pagos
│   ├── cash-summary.tsx             # Resumen de caja
│   ├── mora-row.tsx                 # Fila del panel de mora
│   └── whatsapp-button.tsx          # Botón de envío WhatsApp
├── forms/
│   ├── client-form.tsx              # Formulario de cliente
│   ├── loan-wizard.tsx              # Wizard de 3 pasos para préstamo
│   ├── payment-form.tsx             # Panel de registro de pago
│   └── cobrador-form.tsx            # Formulario de cobrador
└── feedback/
    ├── success-animation.tsx        # Animación verde de pago exitoso
    ├── offline-banner.tsx           # Banner de sin conexión
    └── loading-skeletons.tsx        # Skeletons por módulo

hooks/
├── use-auth.ts                      # Wrapper de auth (user, role, orgId)
├── use-organization.ts              # Datos del tenant actual
├── use-online-status.ts             # Online/offline detection
├── use-geolocation.ts               # GPS para cobros
├── use-whatsapp.ts                  # Generar link wa.me con mensaje
└── use-pagination.ts                # Paginación client-side

providers/
├── auth-provider.tsx                # Context de auth
├── online-provider.tsx              # Context de conectividad
└── query-provider.tsx               # TanStack Query provider
```

---

## 4. Sistema de Diseño y Tokens

### 4.1 Paleta de Colores

La paleta se define en `app/globals.css` usando `@theme inline` de Tailwind v4, extendiendo los tokens existentes:

```css
@import "tailwindcss";

:root {
  /* Existente */
  --background: #ffffff;
  --foreground: #171717;

  /* Brand — Confianza financiera + energía LATAM */
  --primary: #1d4ed8;          /* Azul profesional */
  --primary-foreground: #ffffff;
  --primary-hover: #1e40af;

  /* Semánticos — Estados del negocio */
  --success: #16a34a;          /* Pago exitoso, badge verde */
  --warning: #ca8a04;          /* Mora leve, badge amarillo */
  --danger: #dc2626;           /* Mora severa, badge rojo, errores */
  --info: #0ea5e9;             /* Información, tooltips */

  /* Superficie */
  --card: #ffffff;
  --card-foreground: #171717;
  --muted: #f1f5f9;            /* Fondos secundarios */
  --muted-foreground: #64748b;
  --border: #e2e8f0;
  --ring: #1d4ed8;

  /* Cobrador — Acción rápida */
  --cobrador-action: #16a34a;  /* Botón "Registrar Pago" */
  --cobrador-action-hover: #15803d;
  --cobrador-pending: #f59e0b; /* Cuota pendiente en ruta */
  --cobrador-paid: #22c55e;    /* Cuota pagada en ruta */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-info: var(--info);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-cobrador-action: var(--cobrador-action);
  --color-cobrador-pending: var(--cobrador-pending);
  --color-cobrador-paid: var(--cobrador-paid);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --card: #111111;
    --card-foreground: #ededed;
    --muted: #1a1a2e;
    --muted-foreground: #94a3b8;
    --border: #2d2d44;
  }
}
```

### 4.2 Tipografía

| Uso | Clase Tailwind | Tamaño | Peso |
|-----|---------------|--------|------|
| H1 página | `text-2xl font-bold` | 24px | 700 |
| H2 sección | `text-xl font-semibold` | 20px | 600 |
| H3 tarjeta | `text-lg font-medium` | 18px | 500 |
| Body | `text-base` | 16px | 400 |
| Caption | `text-sm text-muted-foreground` | 14px | 400 |
| Micro (badge) | `text-xs` | 12px | 500 |
| Monto dinero | `text-xl font-bold font-mono` | 20px mono | 700 |

### 4.3 Espaciado y Touch Targets

| Elemento | Regla | Justificación |
|----------|-------|---------------|
| Botones principales | `min-h-11 min-w-11` (44x44px) | SRS: áreas de toque ≥ 44×44px |
| Botón "Registrar Pago" | `h-14` (56px) | Acción más crítica, dedo pulgar cómodo |
| Tarjetas de ruta | `p-4 min-h-[72px]` | Legibles en movimiento, un toque fácil |
| Gap entre tarjetas | `gap-3` (12px) | Evitar toques accidentales |
| Padding de página | `p-4` móvil, `p-6` desktop | 375px base |
| Bottom nav | `h-16` (64px) | Estándar móvil, seguro para gesture bar |

### 4.4 Radios y Sombras

| Elemento | Radio | Sombra |
|----------|-------|--------|
| Tarjetas | `rounded-xl` (12px) | `shadow-sm` |
| Botones | `rounded-lg` (8px) | Ninguna |
| Inputs | `rounded-lg` (8px) | Ring en focus |
| Diálogos / Bottom sheets | `rounded-t-2xl` (16px top) | `shadow-2xl` |
| Badges | `rounded-full` | Ninguna |
| Avatares | `rounded-full` | Ninguna |

### 4.5 Iconografía

- **Librería:** Lucide React (ya usada por shadcn/ui, tree-shakeable, 1500+ iconos)
- **Tamaño estándar:** 20px (`w-5 h-5`)
- **Tamaño acción:** 24px (`w-6 h-6`) para bottom nav
- **Tamaño micro:** 16px (`w-4 h-4`) para badges inline

---

## 5. Layouts y Navegación

### 5.1 Tres Layouts Principales

#### A. Layout Auth `(auth)/`

- Sin sidebar, sin bottom nav
- Centrado verticalmente, max-width `sm:max-w-md`
- Fondo blanco/claro, logo CrédiControl arriba
- Usado en: landing, login, registro, verificación

#### B. Layout Dashboard `(dashboard)/`

```
┌─────────────────────────────────────────────┐
│ Header (h-14): Logo org | Search | Profile  │
├──────────┬──────────────────────────────────┤
│ Sidebar  │                                   │
│ (w-64)   │   Main Content                    │
│          │   (scroll-y-auto, p-4/p-6)        │
│ - Inicio │                                   │
│ - Client.│                                   │
│ - Prést. │                                   │
│ - Ruta   │                                   │
│ - Pagos  │                                   │
│ - Mora   │                                   │
│ - Caja   │                                   │
│ - Report.│                                   │
│ - Config.│                                   │
├──────────┴──────────────────────────────────┤
│ Bottom Nav (h-16) — SOLO en móvil, cobrador │
│ 🏠  🗺️  💰  👤                              │
└─────────────────────────────────────────────┘
```

**Comportamiento responsivo:**

| Breakpoint | Sidebar | Bottom Nav | Header |
|-----------|---------|------------|--------|
| < 768px (móvil) | Oculto, se abre con hamburger | Visible (cobrador) / Oculto (admin) | Compacto |
| 768–1024px (tablet) | Overlay (Sheet) | Oculto | Completo |
| > 1024px (desktop) | Visible fijo | Oculto | Completo |

**Navegación por rol:**

| Ruta | admin | cobrador | super_admin |
|------|-------|----------|-------------|
| Dashboard | ✅ | ✅ (su ruta) | ❌ (va a super-admin) |
| Clientes | ✅ | ❌ | ❌ |
| Préstamos | ✅ | Solo los suyos | ❌ |
| Ruta del día | ✅ (vista todos) | ✅ (solo su ruta) | ❌ |
| Pagos | ✅ | ✅ (solo los suyos) | ❌ |
| Mora | ✅ | ❌ | ❌ |
| Caja | ✅ | ✅ (su cierre) | ❌ |
| Reportes | ✅ | ❌ | ❌ |
| Cobradores | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |
| Perfil | ✅ | ✅ | ✅ |

#### C. Layout Super Admin `(super-admin)/`

- Layout independiente sin sidebar de tenant
- Sidebar propia con: Dashboard, Tenants, Suscripciones, Métricas
- Sin bottom nav (es uso desktop)
- Accesible solo si `role === 'super_admin'`

### 5.2 Bottom Navigation del Cobrador

La pantalla más importante del sistema. 4 tabs:

| Tab | Icono | Ruta | Descripción |
|-----|-------|------|-------------|
| Inicio | `Home` | `/` | Resumen del día: cuántos cobros, cuánto recaudado |
| Ruta | `MapPin` | `/ruta` | Lista de clientes a visitar hoy |
| Pagos | `Banknote` | `/pagos` | Historial de pagos del día |
| Perfil | `User` | `/perfil` | Nombre, cerrar sesión |

**El tab "Ruta" es el más prominente:** badge con número de cobros pendientes, color `--cobrador-action` cuando hay cobros pendientes.

---

## 6. Pantallas por Módulo (SRS → UI)

### 6.1 Landing Page `/`

**Propósito:** Convertir prestamistas al registro.  
**Elementos:**
- Hero: "Digitaliza tu cobranza diaria" + CTA "Comenzar gratis"
- 3 beneficios: Control en tiempo real, Comprobantes WhatsApp, Cero cuadernillos
- Testimonial del cliente piloto (Dairo)
- Pricing: plan gratuito trial 15 días
- Footer: SocioIA

### 6.2 Registro `/register`

**Propósito:** Onboarding del prestamista en < 5 minutos al primer cobro.  
**Campos (alineados con `handle_new_user()` trigger):**
- `nombre_completo` → mapea a `raw_user_meta_data.nombre_completo`
- `nombre_negocio` → mapea a `raw_user_meta_data.nombre_negocio`
- `ciudad` → mapea a `raw_user_meta_data.ciudad`
- `telefono` → mapea a `raw_user_meta_data.telefono`
- `email` → auth signup
- `password` → auth signup

**Post-registro:** Redirigir a `/verify` → verificar email → auto-crear org (trigger) → onboarding tutorial → dashboard.

### 6.3 Login `/login`

Email + password. Supabase Auth. Si `rol === 'super_admin'` → redirigir a `/dashboard`. Si `admin`/`cobrador` → redirigir a `/`.

### 6.4 Dashboard `/`

**Admin:** Tarjetas de métricas del día:
- Recaudo del día (vs. esperado)
- Préstamos activos
- Clientes en mora
- Cobradores activos hoy
- Gráfico mini: recaudo últimos 7 días (Recharts `<AreaChart>`)

**Cobrador:** Vista simplificada:
- Tarjeta grande: "Hoy tienes X cobros por $Y"
- Botón CTA: "Ver mi ruta" → `/ruta`
- Últimos 3 pagos registrados
- Estado de caja personal

### 6.5 Clientes `/clientes`

- Lista con búsqueda instantánea (`?search=` → API `clientes` route con `ilike`)
- Cada fila: nombre, cédula, badge de comportamiento (score_pago → color), teléfono
- FAB "+" para crear cliente (dialog o página)
- Filtros: activo/inactivo
- Click → detalle `/clientes/[id]`

**Detalle del cliente `/clientes/[id]`:**
- Info: nombre, cédula, dirección, barrio, teléfono, notas
- Badge de comportamiento grande
- Historial de préstamos (tabla)
- Estadísticas: total prestado, % puntualidad

### 6.6 Préstamos `/prestamos`

- Lista con filtros: estado (activo/en_mora/saldado/refinanciado/cancelado)
- Cada fila: cliente, capital, modelo, cuota diaria, estado badge, días restantes
- FAB "+ Nuevo préstamo" → `/prestamos/nuevo`

**Crear préstamo `/prestamos/nuevo` — Wizard 3 pasos:**

| Paso | Contenido | Componente |
|------|-----------|------------|
| 1 | Buscar/seleccionar cliente (combobox con búsqueda) o crear inline | `ClientCombobox` |
| 2 | Capital, modelo_interes, tasa, plazo, excluir sáb/dom, cobrador. Preview cronograma en tiempo real | `LoanConditionsForm` |
| 3 | Resumen: total a pagar, cuota diaria, fecha inicio/fin. Confirmar | `LoanSummary` |

Los cálculos usan `calculateLoanTotals()` y `buildLoanSchedule()` de `lib/domain/loans.ts` en el cliente para preview, pero la creación final va al API route `POST /api/prestamos`.

**Detalle del préstamo `/prestamos/[id]`:**
- Info general + estado
- Tabla de cronograma (`cronograma_pagos`): cuota, fecha, monto, estado, medio pago
- Saldo pendiente (de `prestamo_saldos`)
- Botón "Refinanciar" (solo si estado activo/en_mora)
- Botón "Cancelar préstamo" (solo admin)

### 6.7 Ruta del Día `/ruta` — **PANTALLA CRÍTICA**

**Vista cobrador (mobile-first, prioridad absoluta):**

```
┌─────────────────────────────┐
│ ← Ruta de hoy    🔔 3      │
│ Mié 4 junio · 12 cobros    │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🟡 María García         │ │
│ │ Barrio Centro · $60.000 │ │  ← Pendiente (amarillo)
│ │ Cuota 8/30              │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🟢 Carlos Pérez         │ │
│ │ Barrio Norte · $45.000  │ │  ← Pagado (verde)
│ │ Cuota 12/20             │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🟡 Ana Rodríguez        │ │
│ │ Barrio Sur · $60.000    │ │
│ │ Cuota 3/15              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Interacción — 3 toques para registrar pago:**

1. **Toque 1:** Tap en tarjeta del cliente → se abre **bottom sheet** (Sheet de shadcn/ui)
2. **Toque 2:** Monto precargado visible, seleccionar medio de pago (3 chips: Efectivo/Nequi/Transferencia)
3. **Toque 3:** Tap "Registrar Pago" → POST `/api/pagos` → animación de éxito verde → tarjeta cambia a 🟢

**Bottom sheet de pago:**
```
┌─────────────────────────────────┐
│ =                               │  ← Drag handle
│ María García · Cuota 8/30      │
│                                 │
│ Monto: $60.000                  │  ← Editable (para pago parcial)
│ ┌──────┐ ┌──────┐ ┌──────────┐ │
│ │ 💵   │ │ 📱   │ │ 🏦       │ │
│ │Efect.│ │Nequi │ │Transfer. │ │
│ └──────┘ └──────┘ └──────────┘ │
│                                 │
│ [✅ REGISTRAR PAGO]            │  ← Botón 56px, verde
│                                 │
│ ❌ Cliente no encontrado       │  ← Link secundario
└─────────────────────────────────┘
```

**Post-pago exitoso:**
- Animación de checkmark verde (Lottie o CSS)
- Toast: "Pago de $60.000 registrado"
- Tarjeta cambia a estado pagado
- Botón "Enviar WhatsApp" aparece → `wa.me/{telefono}?text={mensaje}` usando `buildReceiptMessage()` de `lib/domain/whatsapp.ts`

**Opciones adicionales en el sheet:**
- "Pago parcial": toggle que habilita campo de monto editable
- "Liquidación total": botón que calcula saldo pendiente y registra pago completo
- "Cliente no encontrado": POST `/api/ruta/visitas` con `resultado: 'no_encontrado'`

**Vista admin de la ruta:**
- Lista de cobradores con su progreso (X de Y cobros, $ recaudado)
- Click en cobrador → ver su lista de clientes
- Mapa opcional (v2, con `lat`/`lng` de `visitas_cobro`)

### 6.8 Mora `/mora`

- Tabla ordenada por días de mora descendente
- Columnas: cliente, préstamo, días mora, monto mora, estado, cobrador
- Filtros: estado (activa/pagada/condonada)
- Cada fila: botón WhatsApp directo al cliente
- Acciones: registrar pago de mora (`POST /api/mora/[id]/pago`), condonar (`POST /api/mora/[id]/condonar`)

### 6.9 Caja `/caja`

**Resumen del día:**
- Tarjetas: total esperado, total recaudado, diferencia, % cumplimiento
- Desglose por medio de pago: efectivo, Nequi, transferencia
- Tabla por cobrador: esperado vs recaudado vs diferencia

**Acciones:**
- "Cerrar mi ruta" (cobrador): formulario con `efectivo_declarado` → `POST /api/caja/cierre-ruta`
- "Cierre general" (admin): consolida todos → `POST /api/caja/cierre-general`
- Historial de cierres: tabla con fecha, cobrador, montos

### 6.10 Reportes `/reportes`

- Selector de período: hoy, esta semana, este mes, rango custom
- Datos de `/api/reportes/resumen`, `/api/reportes/cobradores`, `/api/reportes/cartera-riesgo`, `/api/reportes/proyeccion`
- Gráficos: Recharts `<BarChart>` recaudo por día, `<PieChart>` medios de pago, `<LineChart>` proyección 30 días
- Tabla: top clientes, rendimiento por cobrador
- Botón "Exportar Excel" → `GET /api/reportes/export`

### 6.11 Cobradores `/cobradores` (solo admin)

- Lista de cobradores del tenant
- Crear cobrador: formulario con nombre, teléfono → genera invitación (signup con `organization_id` en metadata)
- Activar/desactivar cobrador
- Historial de actividad por cobrador

### 6.12 Configuración `/configuracion` (solo admin)

**Secciones (alineadas con tabla `tenant_settings`):**
- Info del negocio: nombre, logo (upload a Supabase Storage), ciudad, teléfono
- Política de mora: tipo (porcentaje/monto_fijo), valor, días de gracia
- Días hábiles: cobrar sábados, cobrar domingos
- Tasa de interés predeterminada
- Plantilla WhatsApp (`whatsapp_template`)
- Geolocalización requerida (`geolocalizacion_requerida`)

### 6.13 Super Admin

**Dashboard `/dashboard`:** Métricas globales (`GET /api/super-admin/metricas`)  
**Tenants `/tenants`:** CRUD completo (`/api/super-admin/tenants`) con acciones: activar, suspender, extender período  
**Suscripciones `/suscripciones`:** Estados, pagos, planes  
**Métricas `/metricas`:** Retención, onboarding time, feature usage

---

## 7. Flujos de Usuario Críticos

### 7.1 Flujo Cobrador: Login → Registrar Pago (objetivo: < 30 seg)

```
Login (/login)
  → Auth check: role=cobrador
  → Redirect to / (dashboard cobrador)
  → Ve tarjeta: "12 cobros hoy por $720.000"
  → Tap "Ver mi ruta" (o tab Ruta en bottom nav)
  → /ruta: lista de clientes pendientes
  → Tap en tarjeta de cliente (toque 1)
  → Bottom sheet con monto precargado
  → Seleccionar medio pago (toque 2)
  → Tap "Registrar Pago" (toque 3)
  → Animación éxito + toast
  → Opcional: Tap "Enviar WhatsApp"
  → Tarjeta cambia a pagado ✅
  → Siguiente cliente...
```

### 7.2 Flujo Admin: Crear Préstamo

```
/prestamos → Tap "+ Nuevo préstamo"
  → Paso 1: Buscar cliente (combobox con debounce)
     → Si no existe: "Crear cliente" inline (dialog)
  → Paso 2: Capital, modelo, tasa, plazo
     → Preview cronograma en tiempo real (client-side calculation)
     → Seleccionar cobrador
  → Paso 3: Resumen
     → Total a pagar, cuota diaria, fechas
     → Tap "Confirmar" → POST /api/prestamos
     → Animación de éxito
  → Redirect a /prestamos/[id]
```

### 7.3 Flujo Onboarding: Registro → Primer Cobro (< 5 min)

```
Landing → "Comenzar gratis"
  → /register: nombre, negocio, ciudad, teléfono, email, password
  → POST supabase.auth.signUp({ metadata: { nombre_completo, nombre_negocio, ciudad, telefono } })
  → Trigger: crea organization + profile admin
  → /verify: "Revisa tu correo"
  → Click link en email → verificado
  → Redirect a / (dashboard)
  → Tutorial 3 pasos inline:
     1. "Crea tu primer cliente" → dialog crear cliente
     2. "Crea un cobrador" → dialog crear cobrador
     3. "Crea tu primer préstamo" → wizard simplificado
  → Al completar: dashboard completo desbloqueado
```

---

## 8. Componentes Clave por Módulo

| Módulo | Componente | Tipo | Descripción |
|--------|-----------|------|-------------|
| Auth | `LoginForm` | Form | Email + password, Supabase Auth |
| Auth | `RegisterForm` | Form | 6 campos, Zod v4 validation |
| Auth | `RoleGate` | Utility | `{children}` solo si rol permitido |
| Dashboard | `MetricsGrid` | Display | 4 tarjetas KPI |
| Dashboard | `MiniChart` | Chart | Recharts `<AreaChart>` 7 días |
| Clientes | `ClientList` | List | Búsqueda instantánea, paginación |
| Clientes | `ClientCombobox` | Input | Search + select para préstamos |
| Clientes | `ClientBadge` | Display | score_pago → 🟢🟡🔴 |
| Préstamos | `LoanWizard` | Wizard | 3 pasos con validación por paso |
| Préstamos | `SchedulePreview` | Display | Cronograma calculado client-side |
| Préstamos | `ScheduleTable` | Display | Cronograma persistido (desde DB) |
| Ruta | `RouteCard` | Card | Tarjeta de cliente en ruta |
| Ruta | `PaymentSheet` | Sheet | Bottom sheet de registro de pago |
| Ruta | `SuccessAnimation` | Animation | Checkmark verde post-pago |
| Ruta | `WhatsAppButton` | Action | Link wa.me con mensaje precargado |
| Mora | `MoraTable` | Table | Ordenada por días, con acciones |
| Caja | `CashSummaryCards` | Display | Esperado/recaudado/diferencia/% |
| Caja | `CobradorCashRow` | Row | Fila por cobrador en cierre |
| Reportes | `ReportFilters` | Form | Período + tipo de reporte |
| Reportes | `RecaudoChart` | Chart | Recharts `<BarChart>` |
| Reportes | `MedioPagoPie` | Chart | Recharts `<PieChart>` |
| Layout | `Sidebar` | Nav | Navegación desktop, items por rol |
| Layout | `MobileNav` | Nav | Bottom tab bar para cobrador |
| Layout | `Header` | Nav | Logo org, search, profile menu |
| Feedback | `OfflineBanner` | Banner | "Sin conexión — se reintentará" |
| Feedback | `EmptyState` | Display | Ilustración + CTA cuando no hay datos |

---

## 9. State Management y Data Fetching

### 9.1 Estrategia: Server Components + TanStack Query

| Tipo de dato | Estrategia | Justificación |
|-------------|-----------|---------------|
| Auth (user, role, orgId) | Server Component + `getUser()`/`getRole()` | Ya implementado en `lib/auth.ts`, seguro en servidor |
| Datos de página inicial | Server Component + Supabase direct query | SSR, sin waterfalls, SEO irrelevante (app privada) |
| Datos interactivos (filtros, paginación) | TanStack Query + API Routes | Caching, refetch on window focus, optimistic updates |
| Formularios | React Hook Form + Zod v4 resolver | Validación client-side, schemas compartidos con API |
| Estado UI local (modales, tabs) | `useState` / `useReducer` | Sin necesidad de global state |
| Online/offline | Custom hook + Context | `navigator.onLine` + event listeners |

### 9.2 Patrón de Server Component

```tsx
// app/(dashboard)/clientes/page.tsx (ejemplo conceptual)
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClientList } from "@/components/domain/client-list";

export default async function ClientesPage() {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .eq("organization_id", user.app_metadata.organization_id)
    .eq("activo", true)
    .order("created_at", { ascending: false })
    .limit(20);

  return <ClientList initialData={clientes} />;
}
```

### 9.3 Patrón de Client Component con TanStack Query

```tsx
// hooks/use-clientes.ts (ejemplo conceptual)
import { useQuery } from "@tanstack/react-query";

export function useClientes(search: string, page: number) {
  return useQuery({
    queryKey: ["clientes", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ search, page: String(page) });
      const res = await fetch(`/api/clientes?${params}`);
      return res.json();
    },
  });
}
```

### 9.4 Mutaciones con Optimistic Update (Pagos)

```tsx
// hooks/use-register-payment.ts (ejemplo conceptual)
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useRegisterPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PaymentPayload) => {
      const res = await fetch("/api/pagos", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ruta-hoy"] });
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
    },
  });
}
```

---

## 10. Offline-Aware y Performance Móvil

### 10.1 Estrategia Offline

El SRS exige: "si el cobrador pierde conexión, el sistema avisa claramente y reintenta automáticamente al recuperar red."

| Capa | Implementación |
|------|---------------|
| Detección | `useOnlineStatus()` hook: `navigator.onLine` + `online`/`offline` events |
| UI | `<OfflineBanner />`: barra amarilla fija arriba: "Sin conexión — tus pagos se enviarán al recuperar red" |
| Cola de pagos | `useMutation` con `retry: 3` + `networkMode: 'offlineFirst'` en TanStack Query |
| localStorage backup | Antes de cada POST de pago, guardar en `localStorage` como respaldo |
| Sync on reconnect | En evento `online`, TanStack Query auto-reintenta mutaciones pendientes |
| Feedback | Si POST falla por red: toast "Pago guardado localmente, se enviará cuando haya conexión" |

### 10.2 Performance Móvil (SRS: < 2s en 4G)

| Técnica | Aplicación |
|---------|-----------|
| Server Components | Ruta del día renderizada en servidor, 0 JS para datos iniciales |
| Streaming | `<Suspense>` boundaries: header inmediato, contenido con skeleton |
| Code splitting | Cada módulo es dynamic import si pesa > 30KB |
| Image optimization | `next/image` con `priority` para logos de org |
| Font optimization | Geist via `next/font/google` (ya configurado) |
| TanStack Query staleTime | `staleTime: 30_000` para datos de ruta (30s cache) |
| Pagination | Server-side: API routes ya soportan `page` + `pageSize` |
| Skeleton loading | Shadcn `<Skeleton />` en cada lista/tabla mientras carga |

---

## 11. Accesibilidad (WCAG AA mínimo)

| Requisito SRS | Implementación |
|---------------|---------------|
| Contraste mínimo AA | Todos los colores de la paleta pasan 4.5:1 sobre fondo |
| Áreas de toque ≥ 44×44px | `min-h-11 min-w-11` en todos los botones |
| Etiquetas en campos | `<Label>` shadcn/ui vinculado a cada `<Input>` |
| Navegación por teclado | shadcn/ui incluye focus management |
| Screen reader | `aria-label` en botones de acción (registrar pago, enviar WhatsApp) |
| Anuncios dinámicos | `aria-live="polite"` para toasts de pago exitoso |
| Skip links | Skip al contenido principal desde header |

---

## 12. i18n Preparación

El SRS indica: "v1 en español colombiano. Arquitectura preparada para i18n desde el inicio."

| Decisión | Justificación |
|----------|---------------|
| No instalar `next-intl` en v1 | Overhead innecesario para un solo idioma |
| Strings en archivos constants | `lib/i18n/es.ts` con todas las strings del UI |
| Formato de fechas | `date-fns` con locale `es-CO` |
| Formato de moneda | `formatCop()` ya implementado en `lib/domain/money.ts` |
| Estructura preparada | Si se agrega i18n en v2: `lib/i18n/{es,en,pt}.ts` + provider |

---

## 13. Plan de Implementación por Fases

### Fase 0 — Fundación UI (3 días)

| Día | Tarea | Archivos |
|-----|-------|----------|
| 1 | Instalar dependencias: shadcn/ui init, TanStack Query, React Hook Form, Recharts, date-fns, Sonner, Lucide | `package.json` |
| 1 | Configurar design tokens en `globals.css` | `app/globals.css` |
| 1 | Crear `components/ui/` base: Button, Input, Card, Badge, Skeleton, Sheet, Dialog, Toast | `components/ui/` |
| 2 | Crear layouts: `(auth)/`, `(dashboard)/`, `(super-admin)/` | `app/` |
| 2 | Crear `RoleGate`, `Sidebar`, `MobileNav`, `Header` | `components/layout/` |
| 2 | Crear `AuthProvider`, `OnlineProvider`, `QueryProvider` | `providers/` |
| 3 | Crear hooks base: `useAuth`, `useOnlineStatus`, `useGeolocation`, `useWhatsApp` | `hooks/` |
| 3 | Configurar TanStack Query + Supabase browser client wrapper | `lib/` |

### Fase 1 — Auth + Onboarding (3 días)

| Día | Tarea |
|-----|-------|
| 4 | Landing page `(auth)/page.tsx` |
| 4 | Login page `(auth)/login/page.tsx` con Supabase Auth |
| 5 | Register page `(auth)/register/page.tsx` con Zod v4 validation |
| 5 | Verify page `(auth)/verify/page.tsx` |
| 6 | Onboarding tutorial (3 pasos: cliente → cobrador → préstamo) |
| 6 | Redirect logic post-auth por rol |

### Fase 2 — Ruta + Pagos (5 días) ← **MVP CORE**

| Día | Tarea |
|-----|-------|
| 7 | Dashboard cobrador: resumen del día |
| 8 | Ruta del día: lista de clientes (Server Component + `/api/ruta/hoy`) |
| 9 | Payment Sheet: bottom sheet con monto, medio de pago, registrar |
| 10 | Animación de éxito + WhatsApp comprobante |
| 11 | Offline support + testing en móvil real |

### Fase 3 — Admin Core (5 días)

| Día | Tarea |
|-----|-------|
| 12 | Dashboard admin: métricas + gráficos |
| 13 | Clientes: lista, búsqueda, detalle, crear |
| 14 | Préstamos: lista, wizard 3 pasos, detalle + cronograma |
| 15 | Préstamos: refinanciar + cancelar |
| 16 | Cobradores: gestión + invitación |

### Fase 4 — Operación Completa (4 días)

| Día | Tarea |
|-----|-------|
| 17 | Mora: panel + acciones (pago, condonar, WhatsApp) |
| 18 | Caja: resumen + cierre de ruta + cierre general |
| 19 | Reportes: filtros + gráficos + exportar |
| 20 | Configuración del tenant: todos los campos de `tenant_settings` |

### Fase 5 — Super Admin + Pulido (3 días)

| Día | Tarea |
|-----|-------|
| 21 | Super Admin: dashboard + tenants CRUD |
| 22 | Super Admin: suscripciones + métricas |
| 23 | Pulido: animaciones, edge cases, a11y audit, Lighthouse móvil |

**Total estimado: 23 días (4.5 semanas)**

---

## 14. Mapeo API Routes → Pantallas

| API Route | Método | Pantalla que la consume |
|-----------|--------|----------------------|
| `/api/auth/me` | GET | Auth provider, header |
| `/api/clientes` | GET | `/clientes` lista |
| `/api/clientes` | POST | `/clientes` crear |
| `/api/clientes/[id]` | GET/PATCH/DELETE | `/clientes/[id]` detalle |
| `/api/prestamos` | GET | `/prestamos` lista |
| `/api/prestamos` | POST | `/prestamos/nuevo` wizard |
| `/api/prestamos/[id]` | GET/PATCH | `/prestamos/[id]` detalle |
| `/api/prestamos/[id]/cronograma` | GET | `/prestamos/[id]` tab cronograma |
| `/api/prestamos/[id]/refinanciar` | POST | `/prestamos/[id]` botón refinanciar |
| `/api/prestamos/[id]/cancelar` | POST | `/prestamos/[id]` botón cancelar |
| `/api/pagos` | GET | `/pagos` historial |
| `/api/pagos` | POST | `/ruta` Payment Sheet |
| `/api/pagos/[id]/comprobante` | GET | WhatsApp link |
| `/api/ruta/hoy` | GET | `/ruta` lista del día |
| `/api/ruta/visitas` | POST | `/ruta` "Cliente no encontrado" |
| `/api/mora` | GET | `/mora` panel |
| `/api/mora/run` | POST | Admin: trigger manual (botón) |
| `/api/mora/[id]/pago` | POST | `/mora` registrar pago mora |
| `/api/mora/[id]/condonar` | POST | `/mora` condonar |
| `/api/caja/resumen` | GET | `/caja` resumen del día |
| `/api/caja/historial` | GET | `/caja` historial cierres |
| `/api/caja/cierre-ruta` | POST | `/caja` cierre de ruta cobrador |
| `/api/caja/cierre-general` | POST | `/caja` cierre general admin |
| `/api/reportes/resumen` | GET | `/reportes` resumen |
| `/api/reportes/cobradores` | GET | `/reportes` rendimiento cobradores |
| `/api/reportes/cartera-riesgo` | GET | `/reportes` cartera en riesgo |
| `/api/reportes/proyeccion` | GET | `/reportes` proyección 30 días |
| `/api/reportes/export` | GET | `/reportes` botón exportar |
| `/api/super-admin/tenants` | GET/POST | Super Admin: tenants |
| `/api/super-admin/tenants/[id]` | GET/PATCH | Super Admin: detalle tenant |
| `/api/super-admin/tenants/[id]/activar` | POST | Super Admin: activar |
| `/api/super-admin/tenants/[id]/suspender` | POST | Super Admin: suspender |
| `/api/super-admin/tenants/[id]/extender-periodo` | POST | Super Admin: extender |
| `/api/super-admin/metricas` | GET | Super Admin: métricas globales |

---

## 15. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Next.js 16 breaking changes | Alto: APIs pueden diferir de la intuición | Leer `node_modules/next/dist/docs/` antes de cada feature. heeding AGENTS.md warning |
| React 19 breaking changes | Medio: useEffect estricto, refs, transitions | Probar en dev continuamente, revisar changelog |
| Zod v4 breaking changes | Medio: schemas pueden comportarse distinto | Usar `.safeParse()` (compatible), revisar docs de Zod v4 para métodos específicos |
| Tailwind v4 CSS-first | Medio: hábito de v3 puede causar errores | Solo `@theme inline` para tokens, NO `tailwind.config.ts` |
| Cobrador en Android低端 | Alto: performance en gama media | Server Components por defecto, lazy loading, Lighthouse móvil < 3s |
| Offline real-world | Medio: pérdida de datos de pagos | localStorage backup + TanStack Query retry + feedback claro |
| Supabase SSR cookies | Medio: server/client hydration mismatch | Patrón: Server Component para datos iniciales, Client Component para interactividad |
| shadcn/ui + Tailwind v4 | Bajo: posible incompatibilidad | shadcn/ui v2 soporta Tailwind v4; inicializar con `npx shadcn@latest init` |

---

## Apéndice A: Dependencias a Instalar

```bash
# Componentes
npx shadcn@latest init
npx shadcn@latest add button input card badge skeleton sheet dialog select toast tabs separator avatar dropdown-menu command popover label form

# Data fetching
npm install @tanstack/react-query

# Formularios
npm install react-hook-form @hookform/resolvers

# Gráficos
npm install recharts

# Utilidades
npm install date-fns
npm install sonner
npm install lucide-react

# Dev
npm install -D @testing-library/react @testing-library/jest-dom
```

## Apéndice B: Esquema DB Real → Referencia Rápida

| Tabla | PK | organization_id | Columnas clave |
|-------|-----|-----------------|----------------|
| `organizations` | id uuid | — | nombre_negocio, logo_url, ciudad, telefono, plan, estado_suscripcion, trial_hasta |
| `profiles` | id uuid FK auth.users | ✓ | nombre_completo, rol (enum), telefono, activo, ultimo_acceso |
| `clientes` | id uuid | ✓ | nombre, cedula, telefono, direccion, barrio, notas, score_pago, activo |
| `prestamos` | id uuid | ✓ | cliente_id, cobrador_id, capital, modelo_interes (enum), tasa_mensual, total_pagar, cuota_diaria, plazo_dias, dias_habiles, excluir_sab/dom, fecha_inicio/fin, estado (enum), prestamo_anterior_id, created_by |
| `cronograma_pagos` | id uuid | ✓ | prestamo_id, numero_cuota, fecha_esperada, monto_esperado, monto_capital, monto_interes, saldo_estimado, estado (enum), fecha_pago, monto_pagado, medio_pago (enum), cobrador_id, lat, lng |
| `mora_registros` | id uuid | ✓ | prestamo_id, fecha_inicio_mora, dias_mora, monto_mora, monto_pagado_mora, estado (enum) |
| `cierres_caja` | id uuid | ✓ | cobrador_id, fecha, total_esperado, total_recaudado, efectivo_declarado, cerrado_por |
| `tenant_settings` | organization_id uuid PK | ✓ | tasa_interes_default, mora_tipo, mora_valor, dias_gracia, cobrar_sab/dom_default, whatsapp_template, geolocalizacion_requerida |
| `prestamo_saldos` | prestamo_id uuid PK | ✓ | capital_original, total_original, total_pagado, saldo_pendiente, mora_pendiente |
| `pagos` | id uuid | ✓ | prestamo_id, cronograma_pago_id, cliente_id, cobrador_id, registrado_por, monto, medio_pago (enum), tipo, lat, lng, nota |
| `visitas_cobro` | id uuid | ✓ | cronograma_pago_id, prestamo_id, cliente_id, cobrador_id, resultado (enum), lat, lng, nota |
| `audit_logs` | id uuid | ✓ (nullable) | actor_id, actor_rol, accion, entidad, entidad_id, estado_anterior (jsonb), estado_nuevo (jsonb), ip, user_agent |

**Enums:** `rol`, `estado_suscripcion`, `modelo_interes`, `estado_prestamo`, `estado_cuota`, `medio_pago`, `estado_mora`

---

*SocioIA · CrédiControl · Propuesta de Frontend v1.0 · Junio 2026*
