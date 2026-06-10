"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { OnboardingTutorial } from "@/components/auth/onboarding-tutorial";
import { CobradorDashboard } from "@/components/domain/cobrador-dashboard";
import { Card } from "@/components/ui/card";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCop } from "@/lib/domain/money";
import { useReportesResumen } from "@/hooks/queries/use-reportes";
import { usePrestamos } from "@/hooks/queries/use-prestamos";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  ArrowRight,
  FileText,
  Users,
  Building2,
  Plus,
  BarChart3,
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

function AdminDashboard({ userName }: { userName: string }) {
  const { data: resumen, isLoading: loadingResumen } = useReportesResumen();
  const { data: prestamos, isLoading: loadingPrestamos } = usePrestamos();

  const prestamosActivos = prestamos?.filter((p) => p.estado === "activo").length ?? 0;
  const enMora = prestamos?.filter((p) => p.estado === "en_mora").length ?? 0;
  const recentPrestamos = prestamos?.slice(0, 5) ?? [];

  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5 capitalize">
            {today}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Hola,{" "}
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              {userName}
            </span>
          </h1>
        </div>
        <Link
          href="/app/prestamos/nuevo"
          className={cn(buttonClasses("primary", "sm"), "shrink-0 gap-1.5 shadow-lg shadow-primary/25")}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Nuevo préstamo
        </Link>
      </div>

      {/* Hero metric */}
      {loadingResumen ? (
        <div className="h-36 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-primary/25 p-6">
          {/* Background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.13] via-primary/[0.04] to-violet-500/[0.06]" />
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-success/8 blur-2xl" />

          <div className="relative">
            {/* Live indicator + label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <Wallet className="h-3 w-3" />
                Recaudo de hoy
              </span>
            </div>

            {/* Big number */}
            <p className="text-5xl font-bold tabular-nums tracking-tight text-foreground sm:text-6xl">
              {formatCop(resumen?.recaudoTotal ?? 0)}
            </p>
          </div>
        </div>
      )}

      {/* Stat grid */}
      {loadingPrestamos ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-xl bg-muted animate-pulse" />
          <div className="h-20 rounded-xl bg-muted animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Activos */}
          <Card padding="none" className="relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none mb-2">
                  Activos
                </p>
                <p className="text-3xl font-bold tabular-nums text-foreground leading-none">
                  {prestamosActivos}
                </p>
              </div>
            </div>
          </Card>

          {/* En mora */}
          <Card
            padding="none"
            className={cn(
              "relative overflow-hidden",
              enMora > 0 ? "border-danger/30" : "",
            )}
          >
            <div
              className={cn(
                "absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent",
                enMora > 0 ? "via-danger/50" : "via-border",
              )}
            />
            <div className="p-4 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  enMora > 0 ? "bg-danger/10" : "bg-muted",
                )}
              >
                <AlertTriangle
                  className={cn(
                    "h-4.5 w-4.5",
                    enMora > 0 ? "text-danger" : "text-muted-foreground",
                  )}
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none mb-2">
                  En mora
                </p>
                <p
                  className={cn(
                    "text-3xl font-bold tabular-nums leading-none",
                    enMora > 0 ? "text-danger" : "text-foreground",
                  )}
                >
                  {enMora}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2.5">
        <Link
          href="/app/clientes"
          className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.04]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
            <Users className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            Clientes
          </span>
        </Link>

        <Link
          href="/app/caja"
          className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.04]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
            <Building2 className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            Caja
          </span>
        </Link>

        <Link
          href="/app/reportes"
          className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.04]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
            <BarChart3 className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            Reportes
          </span>
        </Link>
      </div>

      {/* Recent loans */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Últimos préstamos
          </h2>
          <Link
            href="/app/prestamos"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline underline-offset-4"
          >
            Ver todos
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loadingPrestamos ? (
          <SkeletonList count={3} />
        ) : recentPrestamos.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sin préstamos aún"
            description="Crea el primer préstamo para verlo aquí."
          />
        ) : (
          <div className="space-y-2">
            {recentPrestamos.map((p) => (
              <Link key={p.id} href={`/app/prestamos/${p.id}`}>
                <Card
                  padding="sm"
                  className="group cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-primary/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground transition-colors duration-150 group-hover:text-primary">
                        {p.clientes?.nombre ?? "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatCop(p.capital)}{" "}
                        <span className="opacity-40">·</span>{" "}
                        {p.modelo_interes.replace("_", " ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <LoanStatusBadge estado={p.estado} />
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
