"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { OnboardingTutorial } from "@/components/auth/onboarding-tutorial";
import { CobradorDashboard } from "@/components/domain/cobrador-dashboard";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { formatCop } from "@/lib/domain/money";
import { useReportesResumen } from "@/hooks/queries/use-reportes";
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
  FileText,
  CheckCircle2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const userName = user?.email?.split("@")[0] ?? "Usuario";

  if (role === "cobrador") {
    if (showOnboarding) {
      return (
        <div className="mx-auto max-w-md py-4">
          <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />
        </div>
      );
    }
    return <CobradorDashboard userName={userName} />;
  }

  return <AdminDashboard userName={userName} />;
}

/* ─────────────────────────── Admin dashboard ─────────────────────────── */

function AdminDashboard({ userName }: { userName: string }) {
  const { data: resumen, isLoading: loadingResumen } = useReportesResumen();
  const { data: prestamos, isLoading: loadingPrestamos } = usePrestamos();
  const { data: rutaItems, isLoading: loadingRuta } = useRutaHoy();

  const cartaActiva =
    prestamos
      ?.filter((p) => p.estado === "activo")
      .reduce((acc, p) => acc + p.capital, 0) ?? 0;

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

  const metaDia =
    rutaItems?.reduce((acc, i) => acc + i.monto_esperado, 0) ?? 0;
  const progressRecaudo =
    metaDia > 0
      ? Math.min(((resumen?.recaudoTotal ?? 0) / metaDia) * 100, 100)
      : 0;

  const recentPrestamos = prestamos?.slice(0, 6) ?? [];

  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const loading = loadingResumen || loadingPrestamos || loadingRuta;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground capitalize">
            {today}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Hola,{" "}
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              {userName}
            </span>
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Vista general de tu cartera
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/pagos" className={cn(buttonClasses("outline", "sm"), "gap-1.5")}>
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

      {/* ── KPI Grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            icon={Wallet}
            label="Recaudo hoy"
            value={formatCop(resumen?.recaudoTotal ?? 0)}
            foot={metaDia > 0 ? `Meta: ${formatCop(metaDia)}` : undefined}
            progress={metaDia > 0 ? progressRecaudo : undefined}
            accent="indigo"
          />
          <KpiCard
            icon={TrendingUp}
            label="Cartera activa"
            value={
              cartaActiva > 0
                ? formatCop(cartaActiva)
                : `${resumen?.prestamosActivos ?? 0}`
            }
            foot={`${resumen?.prestamosActivos ?? 0} préstamos vigentes`}
            accent="emerald"
          />
          <KpiCard
            icon={AlertTriangle}
            label="En mora"
            value={resumen?.prestamosEnMora ?? 0}
            foot={
              (resumen?.prestamosEnMora ?? 0) === 0
                ? "Cartera sana"
                : `${resumen?.prestamosEnMora} en riesgo`
            }
            footOk={(resumen?.prestamosEnMora ?? 0) === 0}
            accent={
              (resumen?.prestamosEnMora ?? 0) > 0 ? "rose" : "muted"
            }
          />
          <KpiCard
            icon={MapPin}
            label="Ruta de hoy"
            value={totalCobros > 0 ? `${completedCobros}/${totalCobros}` : "—"}
            foot={
              pendingCobros[0]
                ? `Próx: ${pendingCobros[0].prestamos.clientes.nombre.split(" ")[0]}`
                : totalCobros > 0
                  ? "Ruta completada"
                  : "Sin ruta asignada"
            }
            footOk={totalCobros > 0 && pendingCobros.length === 0}
            progress={
              totalCobros > 0
                ? (completedCobros / totalCobros) * 100
                : undefined
            }
            accent="amber"
          />
        </div>
      )}

      {/* ── Cobros pendientes ── */}
      {!loadingRuta && pendingCobros.length > 0 && (
        <section>
          <SectionHead
            title="Cobros pendientes hoy"
            href="/app/ruta"
            linkLabel="Ver ruta"
            count={pendingCobros.length}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {pendingCobros.slice(0, 4).map((cuota, i) => (
              <CobroCard key={cuota.id} cuota={cuota} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Últimos préstamos ── */}
      <section>
        <SectionHead
          title="Últimos préstamos"
          href="/app/prestamos"
          linkLabel="Ver todos"
        />

        {loadingPrestamos ? (
          <div className="rounded-2xl border border-border overflow-hidden">
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
              <p className="text-sm font-medium text-foreground">
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
          <div className="rounded-2xl border border-border overflow-hidden bg-card backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cliente
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Capital
                  </TableHead>
                  <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Modalidad
                  </TableHead>
                  <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    Inicio
                  </TableHead>
                  <TableHead className="hidden w-32 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Avance
                  </TableHead>
                  <TableHead className="pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

/* ─────────────────────────── KPI Card ─────────────────────────── */

type Accent = "indigo" | "emerald" | "amber" | "rose" | "muted";

const accentMap: Record<
  Accent,
  { icon: string; progress: string; glow: string }
> = {
  indigo: {
    icon: "bg-primary/15 text-primary",
    progress: "bg-primary",
    glow: "shadow-primary/10",
  },
  emerald: {
    icon: "bg-success/15 text-success",
    progress: "bg-success",
    glow: "shadow-success/10",
  },
  amber: {
    icon: "bg-warning/15 text-warning",
    progress: "bg-warning",
    glow: "shadow-warning/10",
  },
  rose: {
    icon: "bg-danger/15 text-danger",
    progress: "bg-danger",
    glow: "shadow-danger/10",
  },
  muted: {
    icon: "bg-muted text-muted-foreground",
    progress: "bg-muted-foreground",
    glow: "",
  },
};

function KpiCard({
  icon: Icon,
  label,
  value,
  foot,
  footOk = false,
  accent,
  progress,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  foot?: string;
  footOk?: boolean;
  accent: Accent;
  progress?: number;
}) {
  const a = accentMap[accent];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-4 backdrop-blur-sm",
        "shadow-lg",
        a.glow && `shadow-lg ${a.glow}`,
        "transition-shadow hover:shadow-xl",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl",
            a.icon,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="text-[1.65rem] font-bold tabular-nums leading-none tracking-tight text-foreground">
        {value}
      </div>

      {progress !== undefined && (
        <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              a.progress,
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {foot && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-xs",
            footOk ? "text-success" : "text-muted-foreground",
          )}
        >
          {footOk && <CheckCircle2 className="h-3 w-3 shrink-0" />}
          {foot}
        </p>
      )}
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
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {count !== undefined && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-bold tabular-nums text-primary">
            {count}
          </span>
        )}
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        {linkLabel}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/* ─────────────────────────── Cobro card ─────────────────────────── */

const AVATAR_COLORS: Accent[] = ["indigo", "emerald", "amber", "rose"];

function CobroCard({ cuota, index }: { cuota: CuotaRuta; index: number }) {
  const initials = cuota.prestamos.clientes.nombre.slice(0, 2).toUpperCase();
  const accent = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const a = accentMap[accent];

  return (
    <Link href="/app/ruta">
      <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            a.icon,
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {cuota.prestamos.clientes.nombre}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cuota {cuota.numero_cuota} · vence hoy
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatCop(cuota.monto_esperado)}
          </p>
          <ChevronRight className="ml-auto mt-0.5 h-3 w-3 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
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
    <TableRow className="border-border cursor-pointer" onClick={() => {}}>
      <TableCell className="pl-4">
        <Link href={`/app/prestamos/${prestamo.id}`} className="block group">
          <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {prestamo.clientes?.nombre ?? "—"}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/app/prestamos/${prestamo.id}`} className="block">
          <span className="text-sm tabular-nums text-foreground">
            {formatCop(prestamo.capital)}
          </span>
        </Link>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <span className="text-xs text-muted-foreground capitalize">
          {prestamo.modelo_interes.replace("_", " ")}
        </span>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <span className="text-xs text-muted-foreground">{fechaInicio}</span>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Link href={`/app/prestamos/${prestamo.id}`} className="block">
          {saldo ? (
            <div className="w-28">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[10px] text-muted-foreground tabular-nums">
                {pct}%
              </p>
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
