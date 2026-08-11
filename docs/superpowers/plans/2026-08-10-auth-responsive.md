# Auth Group Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `app/(auth)/*` (landing, login, registro, verify) use available width on tablet/desktop instead of staying pinned to a 448px column, using Tailwind's standard breakpoints (`sm` 640, `md` 768, `lg` 1024).

**Architecture:** Pure Tailwind-class edits to the shared `(auth)` layout and to 4 existing components. No new components, no logic, no copy, no validation changes. Each task is independently visually testable by resizing a browser against `next dev`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4 (existing project stack — no additions).

## Global Constraints

- Breakpoints: Tailwind standard `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px — no custom breakpoints.
- No content, copy, validation, or auth-logic changes — class-only edits.
- `app/app/*` (authenticated app) is out of scope.
- Spec: `docs/superpowers/specs/2026-08-10-auth-responsive-design.md`

---

### Task 1: Widen the shared `(auth)` layout container

**Files:**
- Modify: `app/(auth)/layout.tsx:29-40`

**Interfaces:**
- Consumes: nothing (leaf layout component).
- Produces: a wider `div` wrapper that Tasks 2-5's pages/components render inside. No prop/signature changes — purely visual, so nothing downstream depends on new exports.

- [ ] **Step 1: Update the container width classes**

In `app/(auth)/layout.tsx`, find:

```tsx
      <div className="dash-rise relative w-full max-w-md">
```

Replace with:

```tsx
      <div className="dash-rise relative w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
```

- [ ] **Step 2: Widen the card padding at `lg`**

Find:

```tsx
          <div className="rounded-2xl bg-black/40 p-6 sm:p-8">
```

Replace with:

```tsx
          <div className="rounded-2xl bg-black/40 p-6 sm:p-8 lg:p-10">
```

- [ ] **Step 3: Bump the brand block slightly at `md`**

Find:

```tsx
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/30">
```

Replace with:

```tsx
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/30 md:h-12 md:w-12">
```

And find:

```tsx
            <p className="font-display text-lg font-bold tracking-tight text-foreground">
```

Replace with:

```tsx
            <p className="font-display text-lg font-bold tracking-tight text-foreground md:text-xl">
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`

Open `http://localhost:3000/login` in a browser. Using devtools responsive mode, check widths ~375px, ~640px, ~768px, ~1024px:
- Container visibly grows at each breakpoint (no width stuck at 448px past 640px).
- No horizontal scrollbar appears at any width.
- Card padding increases at 1024px+.

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)/layout.tsx"
git commit -m "feat: widen shared auth layout container across breakpoints"
```

---

### Task 2: Responsive landing page (`app/(auth)/page.tsx`)

**Files:**
- Modify: `app/(auth)/page.tsx`

**Interfaces:**
- Consumes: the widened container from Task 1 (this page renders as `{children}` inside it — no direct import needed, width is inherited).
- Produces: nothing consumed by later tasks — landing page is a leaf route.

- [ ] **Step 1: Scale the hero heading**

Find:

```tsx
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
```

Replace with:

```tsx
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
```

- [ ] **Step 2: Lay CTA buttons side-by-side from `sm`**

Find:

```tsx
      <div className="flex w-full flex-col gap-3">
```

Replace with:

```tsx
      <div className="flex w-full flex-col gap-3 sm:flex-row">
```

- [ ] **Step 3: Grid the benefit cards from `sm`**

Find:

```tsx
      <div className="w-full space-y-3">
        {BENEFITS.map((b) => (
          <Card key={b.title} padding="sm">
```

Replace with:

```tsx
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {BENEFITS.map((b) => (
          <Card key={b.title} padding="sm" className="space-y-0">
```

Note: `Card` forwards `className` via `cn(..., className)` (`components/ui/card.tsx:15-21`), so this passthrough works as-is. The `space-y-3` on the old wrapper is dropped since `gap-3` on the grid replaces it.

- [ ] **Step 4: More breathing room on testimonial/plan banner at `md`**

Find:

```tsx
      <div className="w-full rounded-xl border border-border bg-muted p-4 text-left">
```

Replace with:

```tsx
      <div className="w-full rounded-xl border border-border bg-muted p-4 text-left md:p-6">
```

Find:

```tsx
      <div className="w-full space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
```

Replace with:

```tsx
      <div className="w-full space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center md:p-6">
```

- [ ] **Step 5: Widen outer gap at `md`**

Find:

```tsx
    <div className="flex flex-col items-center gap-8 py-8 text-center">
```

Replace with:

```tsx
    <div className="flex flex-col items-center gap-8 py-8 text-center md:gap-10">
```

- [ ] **Step 6: Manual verification**

With `next dev` running, open `http://localhost:3000/` (the `(auth)` root — confirm this resolves to the landing page, not `/login`). Check at ~375px, ~640px, ~768px, ~1024px:
- CTAs are stacked at 375px, side-by-side from 640px.
- Benefit cards: 1 column at 375px, 2 columns at 640-767px, 3 columns at 768px+.
- No layout overflow or squished text at any width.
- Toggle light/dark mode (if there's a theme toggle in the app) and confirm both render correctly.

- [ ] **Step 7: Commit**

```bash
git add "app/(auth)/page.tsx"
git commit -m "feat: responsive landing page layout for tablet/desktop"
```

---

### Task 3: Responsive login form (`components/auth/login-form.tsx`)

**Files:**
- Modify: `components/auth/login-form.tsx:64-72`

**Interfaces:**
- Consumes: widened container from Task 1.
- Produces: nothing consumed downstream.

- [ ] **Step 1: Scale the title**

Find:

```tsx
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
```

Replace with:

```tsx
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
```

- [ ] **Step 2: Manual verification**

With `next dev` running, open `http://localhost:3000/login` at ~375px, ~768px, ~1024px:
- Title scales up at `md`.
- Two inputs and submit button remain single-column, full width of the (now wider) card, without looking absurdly stretched.

- [ ] **Step 3: Commit**

```bash
git add components/auth/login-form.tsx
git commit -m "feat: scale login form title on wider viewports"
```

---

### Task 4: Responsive register form (`components/auth/register-form.tsx`)

**Files:**
- Modify: `components/auth/register-form.tsx:95-159`

**Interfaces:**
- Consumes: widened container from Task 1.
- Produces: nothing consumed downstream.

- [ ] **Step 1: Scale the title**

Find:

```tsx
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
```

Replace with:

```tsx
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
```

- [ ] **Step 2: Pair nombre completo + nombre negocio in a 2-col grid from `md`**

Find:

```tsx
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label={es.register.nombreCompleto}
          autoComplete="name"
          placeholder="Juan Perez"
          error={errors.nombre_completo?.message}
          {...register("nombre_completo")}
        />

        <Input
          label={es.register.nombreNegocio}
          autoComplete="organization"
          placeholder="Cobros del Valle"
          error={errors.nombre_negocio?.message}
          {...register("nombre_negocio")}
        />

        <Select
          label={es.register.ciudad}
          options={CIUDADES_COLOMBIA}
          placeholder="Selecciona tu ciudad"
          error={errors.ciudad?.message}
          {...register("ciudad")}
        />

        <Input
          label={es.register.telefono}
          type="tel"
          autoComplete="tel"
          placeholder="+57 300 1234567"
          error={errors.telefono?.message}
          {...register("telefono")}
        />

        <Input
          label={es.auth.email}
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordInput
          label={es.auth.password}
          autoComplete="new-password"
          placeholder="Minimo 8 caracteres"
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordInput
          label={es.auth.confirmPassword}
          autoComplete="new-password"
          placeholder="Repite tu contrasena"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
```

Replace with:

```tsx
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={es.register.nombreCompleto}
            autoComplete="name"
            placeholder="Juan Perez"
            error={errors.nombre_completo?.message}
            {...register("nombre_completo")}
          />

          <Input
            label={es.register.nombreNegocio}
            autoComplete="organization"
            placeholder="Cobros del Valle"
            error={errors.nombre_negocio?.message}
            {...register("nombre_negocio")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label={es.register.ciudad}
            options={CIUDADES_COLOMBIA}
            placeholder="Selecciona tu ciudad"
            error={errors.ciudad?.message}
            {...register("ciudad")}
          />

          <Input
            label={es.register.telefono}
            type="tel"
            autoComplete="tel"
            placeholder="+57 300 1234567"
            error={errors.telefono?.message}
            {...register("telefono")}
          />
        </div>

        <Input
          label={es.auth.email}
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PasswordInput
            label={es.auth.password}
            autoComplete="new-password"
            placeholder="Minimo 8 caracteres"
            error={errors.password?.message}
            {...register("password")}
          />

          <PasswordInput
            label={es.auth.confirmPassword}
            autoComplete="new-password"
            placeholder="Repite tu contrasena"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>
```

Note: the closing `</form>` and everything after it (server error message, submit button) is unchanged — only the field block above is restructured into paired grids.

- [ ] **Step 3: Manual verification**

With `next dev` running, open `http://localhost:3000/register` at ~375px, ~768px, ~1024px:
- Below 768px: all 7 fields stack in a single column exactly as before (grid collapses to 1 column).
- At 768px+: nombre/negocio paired, ciudad/telefono paired, password/confirm paired; email spans full width between them.
- Tab order still goes top-to-bottom, left-to-right through the form (DOM order unchanged, only CSS grid placement changed).
- Submit the form with valid data in dev and confirm no console errors (don't need a real signup — just confirm the client-side validation still fires: submit empty, confirm 7 error messages instead of a crash).

- [ ] **Step 4: Commit**

```bash
git add components/auth/register-form.tsx
git commit -m "feat: pair register form fields into 2-col grid on tablet/desktop"
```

---

### Task 5: Verify page — confirm no changes needed

**Files:**
- Read only: `components/auth/verify-form.tsx`

**Interfaces:**
- Consumes: widened container from Task 1.
- Produces: nothing.

- [ ] **Step 1: Manual verification**

With `next dev` running, navigate to `http://localhost:3000/verify` (requires an active Supabase session per the component's `handleResend`/`handleCheckVerification` logic — if unreachable without a real signup, resizing the compiled page is enough; the component has no width-dependent classes to break, so a static resize check suffices even mid-flow).

At ~375px, ~768px, ~1024px, confirm:
- The `Card` (icon, title, description, 2 stacked buttons, footer link) inherits the wider container from Task 1 and doesn't look broken or overflow.
- No changes needed — this task only confirms the assumption from the spec's section 5, since `verify-form.tsx` has no hardcoded narrow-width classes of its own.

- [ ] **Step 2: No commit** (no file changes — this task is a verification checkpoint only)

---

## Final Check

- [ ] Run `npm run build` to confirm no TypeScript/JSX errors across all 4 modified files.
- [ ] Skim `git log --oneline -5` to confirm 4 commits landed (Tasks 1-4; Task 5 has none by design).
