"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { CobradorDashboard } from "@/components/domain/cobrador-dashboard";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { formatCop } from "@/lib/domain/money";
import {
  useReportesResumen,
  useRecaudoDiario,
  type RecaudoDiario,
} from "@/hooks/queries/use-reportes";
import { usePrestamos, type Prestamo } from "@/hooks/queries/use-prestamos";
import { useRutaHoy, type CuotaRuta } from "@/hooks/queries/use-ruta";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Plus,
  Banknote,
  ArrowRight,
  ArrowUpRight,
  FileText,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const userName = user?.nombreCompleto || user?.email?.split("@")[0] || "Usuario";

  if (role === "cobrador") {
    return <CobradorDashboard userName={userName} />;
  }

  return <AdminDashboard userName={userName} />;
}

/* ─────────────────────────── Admin dashboard ─────────────────────────── */

function AdminDashboard({ userName }: { userName: string }) {
  const { data: resumen, isLoading: loadingResumen } = useReportesResumen();
  const { data: prestamos, isLoading: loadingPrestamos } = usePrestamos();
  const { data: rutaItems, isLoading: loadingRuta } = useRutaHoy();
  const { data: recaudoSemana } = useRecaudoDiario();

  const carteraActiva = resumen?.totalPendiente ?? 0;
  const capitalPendiente = resumen?.capitalPendiente ?? 0;
  const interesPendiente = resumen?.interesPendiente ?? 0;

  const pendingCobros =
    rutaItems?.filter(
      (i) =>
        i.estado === "pendiente" ||
        i.estado === "parcial" ||
        i.estado === "mora",
    ) ?? [];
  const completedCobros =
    rutaItems?.filter((i) => i.estado === "pagado").length ?? 0;
  const totalCobros = rutaItems?.length ?? 0;

  const recaudoHoy = resumen?.recaudoTotal ?? 0;
  const metaDia =
    rutaItems?.reduce((acc, i) => acc + i.monto_esperado, 0) ?? 0;
  const progressRecaudo =
    metaDia > 0 ? Math.min((recaudoHoy / metaDia) * 100, 100) : 0;

  const enMora = resumen?.prestamosEnMora ?? 0;
  const recentPrestamos = prestamos?.slice(0, 6) ?? [];

  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const loading = loadingResumen || loadingPrestamos || loadingRuta;

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div className="dash-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            <span className="capitalize">{today}</span>
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Hola, <span className="text-primary">{userName}</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Así amanece tu cartera hoy.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/pagos"
            className={cn(buttonClasses("outline", "sm"), "gap-1.5")}
          >
            <Banknote className="h-3.5 w-3.5" />
            Registrar pago
          </Link>
          <Link
            href="/app/prestamos/nuevo"
            className={cn(buttonClasses("primary", "sm"), "gap-1.5")}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Nuevo préstamo
          </Link>
        </div>
      </div>

      {/* ── Bento: hero recaudo + stats ── */}
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid gap-3 lg:grid-cols-12">
          <HeroRecaudo
            recaudoHoy={recaudoHoy}
            metaDia={metaDia}
            progress={progressRecaudo}
            semana={recaudoSemana}
          />

          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
            <StatTile
              icon={TrendingUp}
              label="Cartera activa · lo que te deben"
              value={formatCop(carteraActiva)}
              foot={`Capital ${formatCop(capitalPendiente)} · Interés ${formatCop(interesPendiente)}`}
              accent="emerald"
              delay={120}
            />
            <StatTile
              icon={AlertTriangle}
              label="En mora"
              value={enMora}
              foot={enMora === 0 ? "Cartera sana" : `${enMora} en riesgo`}
              footOk={enMora === 0}
              accent={enMora > 0 ? "rose" : "muted"}
              delay={180}
              href={enMora > 0 ? "/app/mora" : undefined}
            />
            <StatTile
              icon={MapPin}
              label="Ruta de hoy"
              value={totalCobros > 0 ? `${completedCobros}/${totalCobros}` : "—"}
              foot={
                pendingCobros[0]
                  ? `Próximo: ${pendingCobros[0].prestamos.clientes.nombre.split(" ")[0]}`
                  : totalCobros > 0
                    ? "Ruta completada"
                    : "Sin ruta asignada"
              }
              footOk={totalCobros > 0 && pendingCobros.length === 0}
              accent="amber"
              progress={
                totalCobros > 0
                  ? (completedCobros / totalCobros) * 100
                  : undefined
              }
              delay={240}
              href="/app/ruta"
            />
          </div>
        </div>
      )}

      {/* ── Cobros pendientes ── */}
      {!loadingRuta && pendingCobros.length > 0 && (
        <section className="dash-rise" style={{ animationDelay: "300ms" }}>
          <SectionHead
            title="Cobros pendientes hoy"
            href="/app/ruta"
            linkLabel="Ver ruta"
            count={pendingCobros.length}
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {pendingCobros.slice(0, 4).map((cuota, i) => (
              <CobroTicket key={cuota.id} cuota={cuota} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Últimos préstamos ── */}
      <section className="dash-rise" style={{ animationDelay: "380ms" }}>
        <SectionHead
          title="Últimos préstamos"
          href="/app/prestamos"
          linkLabel="Ver todos"
        />

        {loadingPrestamos ? (
          <div className="overflow-hidden rounded-2xl border border-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-52 animate-pulse rounded bg-muted" />
                </div>
                <div className="hidden h-2 w-20 animate-pulse rounded-full bg-muted sm:block" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : recentPrestamos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
            <FileText className="h-9 w-9 text-muted-foreground/30" />
            <div>
              <p className="font-display text-sm font-semibold text-foreground">
                Sin préstamos aún
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crea el primer préstamo para verlo aquí.
              </p>
            </div>
            <Link
              href="/app/prestamos/nuevo"
              className={cn(buttonClasses("primary", "sm"), "mt-1 gap-1.5")}
            >
              <Plus className="h-3.5 w-3.5" />
              Crear préstamo
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Cliente
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Capital
                  </TableHead>
                  <TableHead className="hidden text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:table-cell">
                    Modalidad
                  </TableHead>
                  <TableHead className="hidden text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground lg:table-cell">
                    Inicio
                  </TableHead>
                  <TableHead className="hidden w-32 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:table-cell">
                    Avance
                  </TableHead>
                  <TableHead className="pr-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Estado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPrestamos.map((p) => (
                  <LoanTableRow key={p.id} prestamo={p} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ─────────────────────────── Hero: recaudo de hoy ─────────────────────────── */

function HeroRecaudo({
  recaudoHoy,
  metaDia,
  progress,
  semana,
}: {
  recaudoHoy: number;
  metaDia: number;
  progress: number;
  semana?: RecaudoDiario[];
}) {
  const pct = Math.round(progress);

  return (
    <section
      className="dash-rise relative overflow-hidden rounded-3xl border border-primary/25 bg-card p-6 shadow-xl shadow-primary/10 backdrop-blur-sm sm:p-7 lg:col-span-7"
      style={{ animationDelay: "60ms" }}
    >
      {/* Atmosphere: glow + ledger grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 15% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--primary) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--primary) 7%, transparent) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 100% 100% at 50% 0%, black, transparent 80%)",
        }}
      />

      <div className="relative flex h-full flex-col gap-6 sm:flex-row sm:items-stretch sm:justify-between">
        {/* Left: the number */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Recaudo de hoy
            </span>
          </div>

          <p className="mt-4 font-display text-[2.6rem] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-5xl">
            {formatCop(recaudoHoy)}
          </p>

          {metaDia > 0 ? (
            <div className="mt-5 max-w-xs">
              <div className="flex items-baseline justify-between gap-4 text-xs">
                <span className="text-muted-foreground">
                  Meta del día{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatCop(metaDia)}
                  </span>
                </span>
                <span className="font-display text-sm font-bold text-primary tabular-nums">
                  {pct}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="dash-fill h-full rounded-full bg-gradient-to-r from-primary to-violet-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-5 text-xs text-muted-foreground">
              Sin meta de ruta para hoy.
            </p>
          )}

          <Link
            href="/app/reportes"
            className="group mt-auto flex w-fit items-center gap-1 pt-5 text-xs font-semibold text-primary"
          >
            Ver reportes
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Right: 7-day chart */}
        <WeekChart semana={semana} />
      </div>
    </section>
  );
}

function WeekChart({ semana }: { semana?: RecaudoDiario[] }) {
  if (!semana || semana.length === 0) return null;

  const max = Math.max(
    ...semana.map((d) => Math.max(d.recaudado, d.esperado)),
    1,
  );
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex shrink-0 flex-col justify-end sm:w-56">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
        Últimos 7 días
      </p>
      <div className="flex h-24 items-end gap-1.5">
        {semana.map((d, i) => {
          const isToday = d.fecha === todayIso;
          const hRecaudado = Math.max((d.recaudado / max) * 100, 3);
          const hEsperado = Math.max((d.esperado / max) * 100, 3);
          const dia = new Date(`${d.fecha}T12:00:00`)
            .toLocaleDateString("es-CO", { weekday: "narrow" })
            .toUpperCase();

          return (
            <div
              key={d.fecha}
              className="group/bar relative flex h-full flex-1 flex-col justify-end"
              title={`${d.fecha}: ${formatCop(d.recaudado)} de ${formatCop(d.esperado)}`}
            >
              {/* esperado (ghost) */}
              <div
                className="absolute bottom-5 left-0 right-0 rounded-t-[3px] bg-muted"
                style={{ height: `calc(${hEsperado}% - 1.25rem)` }}
              />
              {/* recaudado */}
              <div
                className={cn(
                  "dash-bar relative z-10 mb-1 rounded-t-[3px] transition-colors",
                  isToday
                    ? "bg-gradient-to-t from-primary to-violet-400 shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_45%,transparent)]"
                    : "bg-primary/45 group-hover/bar:bg-primary/70",
                )}
                style={{
                  height: `calc(${hRecaudado}% - 1.25rem)`,
                  animationDelay: `${250 + i * 70}ms`,
                }}
              />
              <span
                className={cn(
                  "text-center text-[9px] font-bold tabular-nums",
                  isToday ? "text-primary" : "text-muted-foreground/60",
                )}
              >
                {dia}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── Stat tiles ─────────────────────────── */

type Accent = "indigo" | "emerald" | "amber" | "rose" | "muted";

const accentMap: Record<Accent, { icon: string; ring: string; progress: string }> = {
  indigo: {
    icon: "bg-gradient-to-br from-primary/25 via-primary/10 to-transparent text-primary",
    ring: "ring-primary/15",
    progress: "bg-gradient-to-r from-primary to-violet-400",
  },
  emerald: {
    icon: "bg-gradient-to-br from-success/25 via-success/10 to-transparent text-success",
    ring: "ring-success/15",
    progress: "bg-gradient-to-r from-success to-emerald-400",
  },
  amber: {
    icon: "bg-gradient-to-br from-warning/25 via-warning/10 to-transparent text-warning",
    ring: "ring-warning/15",
    progress: "bg-gradient-to-r from-warning to-amber-400",
  },
  rose: {
    icon: "bg-gradient-to-br from-danger/25 via-danger/10 to-transparent text-danger",
    ring: "ring-danger/15",
    progress: "bg-gradient-to-r from-danger to-rose-400",
  },
  muted: {
    icon: "bg-muted text-muted-foreground",
    ring: "ring-border",
    progress: "bg-muted-foreground",
  },
};

function StatTile({
  icon: Icon,
  label,
  value,
  foot,
  footOk = false,
  accent,
  progress,
  delay = 0,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  foot?: string;
  footOk?: boolean;
  accent: Accent;
  progress?: number;
  delay?: number;
  href?: string;
}) {
  const a = accentMap[accent];

  const body = (
    <div
      className={cn(
        "dash-rise group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card px-4 py-4 shadow-sm shadow-black/[0.03] backdrop-blur-sm transition-all dark:shadow-black/20",
        href && "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
          a.icon,
          a.ring,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-display text-2xl font-bold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {progress !== undefined && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("dash-fill h-full rounded-full", a.progress)}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
        {foot && (
          <p
            className={cn(
              "mt-1.5 flex items-center gap-1 truncate text-xs",
              footOk ? "text-success" : "text-muted-foreground",
            )}
          >
            {footOk && <CheckCircle2 className="h-3 w-3 shrink-0" />}
            {foot}
          </p>
        )}
      </div>

      {href && (
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

/* ─────────────────────────── Skeleton ─────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-12">
      <div className="h-64 animate-pulse rounded-3xl bg-muted lg:col-span-7" />
      <div className="grid gap-3 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Section head ─────────────────────────── */

function SectionHead({
  title,
  href,
  linkLabel,
  count,
}: {
  title: string;
  href: string;
  linkLabel: string;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <h2 className="shrink-0 font-display text-lg font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {count !== undefined && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-bold tabular-nums text-primary">
            {count}
          </span>
        )}
        <span className="hidden h-px flex-1 bg-gradient-to-r from-border to-transparent sm:block" />
      </div>
      <Link
        href={href}
        className="group flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        {linkLabel}
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/* ─────────────────────────── Cobro ticket ─────────────────────────── */

const AVATAR_COLORS: Accent[] = ["indigo", "emerald", "amber", "rose"];

function CobroTicket({ cuota, index }: { cuota: CuotaRuta; index: number }) {
  const initials = cuota.prestamos.clientes.nombre.slice(0, 2).toUpperCase();
  const accent = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const a = accentMap[accent];
  const enMora = cuota.estado === "mora";

  return (
    <Link href="/app/ruta" className="block">
      <div className="group relative flex items-stretch overflow-hidden rounded-xl border border-border bg-card backdrop-blur-sm transition-all hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5">
        {/* Cliente */}
        <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3.5 pr-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              a.icon,
            )}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {cuota.prestamos.clientes.nombre}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cuota {cuota.numero_cuota}
              {enMora ? (
                <span className="font-semibold text-danger"> · en mora</span>
              ) : (
                " · vence hoy"
              )}
            </p>
          </div>
        </div>

        {/* Línea de corte estilo recibo */}
        <div className="relative shrink-0 border-l border-dashed border-border">
          <span className="absolute -left-[5px] -top-[5px] h-2.5 w-2.5 rounded-full border border-border bg-background" />
          <span className="absolute -bottom-[5px] -left-[5px] h-2.5 w-2.5 rounded-full border border-border bg-background" />
        </div>

        {/* Monto */}
        <div className="flex w-28 shrink-0 flex-col items-end justify-center gap-0.5 py-3 pr-3.5">
          <p className="font-display text-sm font-bold tabular-nums text-foreground">
            {formatCop(cuota.monto_esperado)}
          </p>
          <p className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 transition-colors group-hover:text-primary">
            Cobrar
            <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────── Loan table row ─────────────────────────── */

function LoanTableRow({ prestamo }: { prestamo: Prestamo }) {
  const saldo = prestamo.prestamo_saldos?.[0];
  const pct =
    saldo && saldo.cuotas_totales > 0
      ? Math.round((saldo.cuotas_pagadas / saldo.cuotas_totales) * 100)
      : 0;

  const fechaInicio = prestamo.fecha_inicio
    ? new Date(prestamo.fecha_inicio).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })
    : "—";

  return (
    <TableRow className="group border-border cursor-pointer transition-colors hover:bg-primary/[0.04]">
      <TableCell className="pl-4">
        <Link href={`/app/prestamos/${prestamo.id}`} className="block">
          <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {prestamo.clientes?.nombre ?? "—"}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/app/prestamos/${prestamo.id}`} className="block">
          <span className="text-sm font-medium tabular-nums text-foreground">
            {formatCop(prestamo.capital)}
          </span>
        </Link>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <span className="text-xs capitalize text-muted-foreground">
          {prestamo.modelo_interes.replace("_", " ")}
        </span>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <span className="text-xs text-muted-foreground">{fechaInicio}</span>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Link href={`/app/prestamos/${prestamo.id}`} className="block">
          {saldo ? (
            <div className="flex w-28 items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-7 text-right text-[10px] tabular-nums text-muted-foreground">
                {pct}%
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </Link>
      </TableCell>
      <TableCell className="pr-4">
        <Link href={`/app/prestamos/${prestamo.id}`} className="block">
          <LoanStatusBadge estado={prestamo.estado} />
        </Link>
      </TableCell>
    </TableRow>
  );
}
