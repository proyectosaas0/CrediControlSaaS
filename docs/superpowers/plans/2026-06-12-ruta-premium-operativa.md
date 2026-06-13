# Ruta Premium Operativa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine `/app/ruta` into a premium, high-clarity cobranza screen with stronger hierarchy, better mobile behavior, and consistent light/dark styling.

**Architecture:** Keep the current route structure and upgrade presentation only. The page will add a compact KPI strip above the filter pills, the route cards will become denser and more informative, and the admin route view will match the same visual language. Reuse the existing design system (`Card`, `Badge`, `PageHeader`, `FilterPills`, `PlatformStat`) instead of introducing new dependencies.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, existing in-repo UI primitives.

---

### Task 1: Redesign the cobrador route page shell

**Files:**
- Modify: `app/app/ruta/page.tsx`

- [ ] **Step 1: Update the page layout to add a KPI strip**

```tsx
<div className="space-y-5">
  <PageHeader ... />

  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <PlatformStat ... />
    <PlatformStat ... />
    <PlatformStat ... />
    <PlatformStat ... />
  </div>

  <div className="dash-rise" style={{ animationDelay: "60ms" }}>
    <FilterPills ... />
  </div>
  ...
</div>
```

- [ ] **Step 2: Compute the summary metrics from `items` and `pendientes`**

```tsx
const totalEsperado = items.reduce((sum, item) => sum + item.montoEsperado, 0);
const totalPagado = items.reduce((sum, item) => sum + (item.montoPagado ?? 0), 0);
const totalPendiente = items.reduce((sum, item) => sum + Math.max(item.saldoPendiente, 0), 0);
const avance = items.length > 0 ? Math.round(((items.length - pendientes.length) / items.length) * 100) : 0;
```

- [ ] **Step 3: Improve the empty state and loading state copy**

```tsx
if (isLoading) {
  return (
    <Card padding="md" className="py-12 text-center">
      <p className="text-sm font-medium text-foreground">Cargando la ruta de hoy...</p>
      <p className="mt-1 text-xs text-muted-foreground">Preparando cobros, estados y filtros.</p>
    </Card>
  );
}
```

### Task 2: Elevate the route cards for faster scanning

**Files:**
- Modify: `components/domain/route-card.tsx`

- [ ] **Step 1: Increase visual hierarchy and spacing without making the card taller than necessary**

```tsx
className={cn(
  "group w-full rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.99]",
  "bg-card/90 shadow-sm shadow-black/5 backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-lg",
  estado === "pendiente" && "border-warning/25 hover:border-warning/40",
  estado === "pagado" && "border-success/25",
  estado === "parcial" && "border-info/25 hover:border-info/40",
  estado === "mora" && "border-danger/25 hover:border-danger/40",
  estado === "no_encontrado" && "border-border",
)}
```

- [ ] **Step 2: Show amount, status, and cuota info with clearer hierarchy**

```tsx
<div className="flex items-start justify-between gap-3">
  <div className="min-w-0 flex-1 space-y-1">
    <div className="flex items-center gap-2">
      <Circle className={cn("h-2.5 w-2.5 shrink-0", config.dot)} />
      <span className="truncate text-[15px] font-semibold text-foreground">{clienteNombre}</span>
    </div>
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <MapPin className="h-3 w-3 shrink-0" />
      <span className="truncate">{barrio || "Sin barrio"}</span>
    </div>
  </div>

  <div className="flex shrink-0 flex-col items-end gap-1">
    <Badge variant={config.badge} className="shadow-sm">{config.label}</Badge>
    <span className="text-[11px] text-muted-foreground">Cuota {cuotaNumero}/{cuotaTotal || "-"}</span>
  </div>
</div>
<div className="mt-3 flex items-end justify-between gap-3 border-t border-border/60 pt-3">
  <div>
    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Monto</p>
    <p className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">{formatCop(montoPagado ?? montoEsperado)}</p>
  </div>
  <p className="text-xs text-muted-foreground">Saldo {formatCop(Math.max(montoEsperado - (montoPagado ?? 0), 0))}</p>
</div>
```

- [ ] **Step 3: Keep click behavior unchanged for pagado/no_encontrado items**

```tsx
function handleCardClick(item: RouteItem) {
  if (item.estado === "pagado" || item.estado === "no_encontrado") return;
  setSelectedItem(item);
  setSheetOpen(true);
}
```

### Task 3: Match the admin route panel to the new visual system

**Files:**
- Modify: `components/domain/admin-ruta-view.tsx`

- [ ] **Step 1: Rework the admin card so it mirrors the premium route language**

```tsx
<Card key={c.nombre} padding="md" className="overflow-hidden border-border/80 bg-card/90 backdrop-blur-sm">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="font-semibold text-foreground">{c.nombre}</p>
      <p className="text-sm text-muted-foreground">{c.realizados} de {c.total} cobros</p>
    </div>
    <div className="text-right">
      <p className="font-display text-lg font-bold tabular-nums text-success">{formatCop(c.recaudado)}</p>
      <Badge variant={pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger"}>{pct}%</Badge>
    </div>
  </div>
  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
    <div className={...} style={{ width: `${pct}%` }} />
  </div>
</Card>
```

### Task 4: Verify the redesign in both themes

**Files:**
- None

- [ ] **Step 1: Run lint to catch className or TS regressions**

```bash
npm run lint
```

- [ ] **Step 2: Inspect the changed route page in light and dark mode**

```bash
npm run dev
```

Expected: `/app/ruta` shows a stronger header, summary metrics, readable filters, and cards that remain clear in both themes.
