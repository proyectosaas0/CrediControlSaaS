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
import { cn } from "@/components/ui/cn";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Plus,
  Banknote,
  ArrowRight,
  type LucideIcon,
  FileText,
  CheckCircle2,
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

  const cartaActiva = prestamos
    ?.filter((p) => p.estado === "activo")
    .reduce((acc, p) => acc + p.capital, 0) ?? 0;

  const pendingCobros = rutaItems?.filter(
    (i) => i.estado === "pendiente" || i.estado === "parcial" || i.estado === "mora",
  ) ?? [];
  const completedCobros = rutaItems?.filter((i) => i.estado === "pagado").length ?? 0;
  const totalCobros = rutaItems?.length ?? 0;

  // meta = suma de cuotas esperadas hoy
  const metaDia = rutaItems?.reduce((acc, i) => acc + i.monto_esperado, 0) ?? 0;
  const progressRecaudo =
    metaDia > 0 ? Math.min(((resumen?.recaudoTotal ?? 0) / metaDia) * 100, 100) : 0;

  const recentPrestamos = prestamos?.slice(0, 5) ?? [];

  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const loading = loadingResumen || loadingPrestamos || loadingRuta;

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground capitalize">
            {today}
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            Hola,{" "}
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              {userName}
            </span>{" "}
            👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumen de tu cartera</p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/app/pagos"
            className={cn(
              buttonClasses("outline", "sm"),
              "gap-2",
            )}
          >
            <Banknote className="h-3.5 w-3.5" />
            Registrar pago
          </Link>
          <Link
            href="/app/prestamos/nuevo"
            className={cn(
              buttonClasses("primary", "sm"),
              "gap-2 shadow-lg shadow-primary/20",
            )}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Nuevo préstamo
          </Link>
        </div>
      </div>

      {/* ── KPI grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
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
            progressColor="bg-success"
            iconClass="bg-success/12 text-success"
          />
          <KpiCard
            icon={TrendingUp}
            label="Cartera activa"
            value={cartaActiva > 0 ? formatCop(cartaActiva) : `${resumen?.prestamosActivos ?? 0}`}
            foot={`${resumen?.prestamosActivos ?? 0} préstamos vigentes`}
            iconClass="bg-primary/12 text-primary"
          />
          <KpiCard
            icon={AlertTriangle}
            label="En mora"
            value={resumen?.prestamosEnMora ?? 0}
            foot={
              (resumen?.prestamosEnMora ?? 0) === 0
                ? "✓ Cartera sana"
                : `${resumen?.prestamosEnMora} en riesgo`
            }
            footOk={(resumen?.prestamosEnMora ?? 0) === 0}
            iconClass={
              (resumen?.prestamosEnMora ?? 0) > 0
                ? "bg-danger/12 text-danger"
                : "bg-muted text-muted-foreground"
            }
          />
          <KpiCard
            icon={MapPin}
            label="Ruta de hoy"
            value={
              totalCobros > 0
                ? `${completedCobros} / ${totalCobros}`
                : "—"
            }
            foot={
              pendingCobros[0]
                ? `Próximo: ${pendingCobros[0].prestamos.clientes.nombre.split(" ")[0]}`
                : totalCobros > 0
                ? "Ruta completada"
                : "Sin ruta asignada"
            }
            footOk={totalCobros > 0 && pendingCobros.length === 0}
            iconClass="bg-warning/12 text-warning"
            progress={totalCobros > 0 ? (completedCobros / totalCobros) * 100 : undefined}
            progressColor="bg-warning"
          />
        </div>
      )}

      {/* ── Cobros pendientes hoy ── */}
      {!loadingRuta && pendingCobros.length > 0 && (
        <section>
          <SectionHead title="Cobros pendientes hoy" href="/app/ruta" linkLabel="Ver ruta completa" />
          <div className="flex flex-col gap-2.5">
            {pendingCobros.slice(0, 5).map((cuota, i) => (
              <CobroPendienteRow key={cuota.id} cuota={cuota} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Últimos préstamos ── */}
      <section>
        <SectionHead title="Últimos préstamos" href="/app/prestamos" linkLabel="Ver todos" />

        {loadingPrestamos ? (
          <div className="rounded-xl border border-border overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border p-4 last:border-b-0">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-56 animate-pulse rounded bg-muted" />
                </div>
                <div className="hidden h-2 w-24 animate-pulse rounded-full bg-muted sm:block" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : recentPrestamos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border border-dashed py-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">Sin préstamos aún</p>
              <p className="text-xs text-muted-foreground mt-1">Crea el primer préstamo para verlo aquí.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {recentPrestamos.map((p) => (
              <LoanRow key={p.id} prestamo={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

function SectionHead({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      <Link
        href={href}
        className="flex items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-4"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

const AVATAR_COLORS = [
  "bg-primary/12 text-primary",
  "bg-success/12 text-success",
  "bg-warning/12 text-warning",
  "bg-danger/12 text-danger",
];

function CobroPendienteRow({
  cuota,
  index,
}: {
  cuota: CuotaRuta;
  index: number;
}) {
  const initials = cuota.prestamos.clientes.nombre.slice(0, 2).toUpperCase();
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const modelo = cuota.prestamos.capital;

  return (
    <Link href="/app/ruta">
      <div className="group flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/25 hover:bg-primary/[0.02]">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            avatarColor,
          )}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {cuota.prestamos.clientes.nombre}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cuota {cuota.numero_cuota} · vence hoy
          </p>
        </div>

        {/* Amount */}
        <div className="hidden text-right sm:block mr-1">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatCop(cuota.monto_esperado)}
          </p>
          <p className="text-xs text-muted-foreground">cuota</p>
        </div>

        {/* CTA */}
        <span
          className={cn(
            buttonClasses("outline", "sm"),
            "pointer-events-none shrink-0 text-xs",
          )}
        >
          Cobrar
        </span>
      </div>
    </Link>
  );
}

function LoanRow({ prestamo }: { prestamo: Prestamo }) {
  const saldo = prestamo.prestamo_saldos?.[0];
  const pct =
    saldo && saldo.cuotas_totales > 0
      ? Math.round((saldo.cuotas_pagadas / saldo.cuotas_totales) * 100)
      : 0;

  const fechaInicio = prestamo.fecha_inicio
    ? new Date(prestamo.fecha_inicio).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <Link href={`/app/prestamos/${prestamo.id}`}>
      <div className="group flex items-center gap-4 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-muted/60">
        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {prestamo.clientes?.nombre ?? "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatCop(prestamo.capital)}{" "}
            <span className="opacity-50">·</span>{" "}
            {prestamo.modelo_interes.replace("_", " ")}
            {fechaInicio && (
              <>
                {" "}
                <span className="opacity-50">·</span>{" "}
                desembolsado {fechaInicio}
              </>
            )}
          </p>
        </div>

        {/* Progress */}
        {saldo && (
          <div className="hidden w-28 shrink-0 sm:block">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[11px] text-muted-foreground">
              {pct}% pagado
            </p>
          </div>
        )}

        <LoanStatusBadge estado={prestamo.estado} />
      </div>
    </Link>
  );
}

/* ─────────────────────────── KPI Card ─────────────────────────── */

function KpiCard({
  icon: Icon,
  label,
  value,
  foot,
  footOk = false,
  iconClass,
  progress,
  progressColor = "bg-primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  foot?: string;
  footOk?: boolean;
  iconClass: string;
  progress?: number;
  progressColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            iconClass,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </div>

      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-700", progressColor)}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {foot && (
        <p
          className={cn(
            "mt-2 text-xs",
            footOk ? "text-success" : "text-muted-foreground",
          )}
        >
          {footOk && <CheckCircle2 className="mr-1 inline-block h-3 w-3" />}
          {foot}
        </p>
      )}
    </div>
  );
}
