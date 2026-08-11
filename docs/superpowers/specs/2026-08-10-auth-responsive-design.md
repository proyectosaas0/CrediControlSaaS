# Diseño responsivo — grupo (auth)

**Fecha:** 2026-08-10
**Alcance:** `app/(auth)/*` — landing pre-login, login, registro, verify.

## Problema

El grupo de rutas `(auth)` comparte `app/(auth)/layout.tsx`, que envuelve todo el
contenido en `max-w-md` (448px) fijo, sin variar por breakpoint. En tablet y
desktop esto se traduce en:

- Una columna angosta centrada con mucho espacio vacío a los lados.
- Scroll vertical largo en la landing (hero → CTAs → 3 cards de beneficios
  apiladas → testimonio → banner de plan → footer, todo en columna única).
- Formularios (especialmente registro, con 7 campos) estirados verticalmente
  sin aprovechar el ancho disponible.

## Objetivo

Hacer que las 4 páginas del grupo `(auth)` aprovechen el ancho en tablet/desktop
usando los breakpoints estándar de Tailwind (`sm` 640, `md` 768, `lg` 1024,
`xl` 1280), sin cambiar contenido, copy, validación ni lógica — solo clases
responsivas sobre la estructura existente.

## Diseño

### 1. Contenedor compartido — `app/(auth)/layout.tsx`

El wrapper `w-full max-w-md` pasa a crecer por breakpoint:

```
w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl
```

- `<640px`: 448px (igual que hoy).
- `sm` (640px): ~512px.
- `md` (768px): ~576px.
- `lg` (1024px+): ~672px.

El padding interno de la tarjeta (`p-6 sm:p-8`) gana `lg:p-10`. El bloque de
marca (logo + nombre) sube ligeramente de tamaño en `md:`.

Esto beneficia a las 4 páginas por igual, ya que todas comparten este layout.

### 2. Landing — `app/(auth)/page.tsx`

- Hero: `text-3xl sm:text-4xl` → agrega `md:text-5xl`.
- CTAs (`Comenzar gratis` / `Ya tengo cuenta`): `flex-col` → `sm:flex-row`,
  lado a lado desde tablet en vez de apilados full-width.
- Cards de beneficios: `space-y-3` (apiladas) → `sm:grid sm:grid-cols-2
  md:grid-cols-3 sm:gap-3` — 2 columnas en tablet, 3 en desktop, para no
  verse apretadas en `sm`.
- Testimonio y banner de plan gratis: `md:p-6` para más aire, siguen
  full-width del contenedor ya ensanchado.
- Espaciado general: `gap-8` → `md:gap-10`.

### 3. Login — `components/auth/login-form.tsx`

Solo 2 campos; hereda el contenedor más ancho de la sección 1, sin grid.
Título `text-2xl` → `md:text-3xl`.

### 4. Registro — `components/auth/register-form.tsx`

7 campos. Se agrupan en pares dentro de `md:grid md:grid-cols-2 md:gap-4`:

- nombre completo + nombre de negocio
- ciudad + teléfono
- password + confirmar password

Email queda en fila completa (ancla visual entre los grupos). El botón de
submit sigue `w-full` ocupando todo el ancho del contenedor. Título
`text-2xl` → `md:text-3xl`.

### 5. Verify — `components/auth/verify-form.tsx`

Es un `Card` simple (ícono, título, descripción, 2 botones apilados, link).
No necesita grid — hereda el contenedor ensanchado de la sección 1. Sin
cambios estructurales.

## Fuera de alcance

- `app/app/*` (dashboard y resto de la app autenticada) — no se toca en esta
  ronda.
- Cambios de copy, validación de formularios, o lógica de autenticación.
- Layout de 2 columnas (formulario + panel visual) en la landing — se
  descartó a favor de mantener una sola columna más ancha.

## Testing

- Revisión visual manual en el navegador con `next dev`, en anchos ~375px
  (móvil), ~768px (tablet), ~1024px y ~1440px (desktop), en modo claro y
  oscuro.
- Verificar que los formularios de login/registro siguen funcionando
  (submit, validación, mensajes de error) sin cambios de comportamiento.
