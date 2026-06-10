"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { OnboardingTutorial } from "@/components/auth/onboarding-tutorial";
import { CobradorDashboard } from "@/components/domain/cobrador-dashboard";
import { Card } from "@/components/ui/card";
import { SkeletonGrid, SkeletonList } from "@/components/ui/skeleton";
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
    <div className="space-y-6">

      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1 capitalize">
            {today}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Hola, <span className="text-primary">{userName}</span>
          </h1>
        </div>
        <Link
          href="/app/prestamos/nuevo"
          className={cn(buttonClasses("primary", "sm"), "shrink-0 gap-1.5")}
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo préstamo
        </Link>
      </div>

      {/* Hero metric — today's collection */}
      {loadingResumen ? (
        <div className="h-28 rounded-xl bg-muted animate-pulse" />
      ) : (
        <Card padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-success/[0.04] pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-success/15">
                <Wallet className="h-3.5 w-3.5 text-success" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Recaudo de hoy
              </p>
            </div>
            <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
              {formatCop(resumen?.recaudoTotal ?? 0)}
            </p>
          </div>
        </Card>
      )}

      {/* Secondary stats */}
      {loadingPrestamos ? (
        <SkeletonGrid count={2} cols={2} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-1.5">
                  Activos
                </p>
                <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
                  {prestamosActivos}
                </p>
              </div>
            </div>
          </Card>

          <Card
            padding="md"
            className={enMora > 0 ? "border-danger/25" : ""}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  enMora > 0 ? "bg-danger/10" : "bg-muted",
                )}
              >
                <AlertTriangle
                  className={cn(
                    "h-4 w-4",
                    enMora > 0 ? "text-danger" : "text-muted-foreground",
                  )}
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-1.5">
                  En mora
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold tabular-nums leading-none",
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
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/app/clientes"
          className={cn(buttonClasses("outline", "sm"), "w-full gap-2")}
        >
          <Users className="h-3.5 w-3.5" />
          Clientes
        </Link>
        <Link
          href="/app/caja"
          className={cn(buttonClasses("outline", "sm"), "w-full gap-2")}
        >
          <Building2 className="h-3.5 w-3.5" />
          Caja
        </Link>
      </div>

      {/* Recent loans */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Últimos préstamos
          </h2>
          <Link
            href="/app/prestamos"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
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
                  className="hover:border-primary/25 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-150">
                        {p.clientes?.nombre ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCop(p.capital)}{" "}
                        <span className="opacity-50">·</span>{" "}
                        {p.modelo_interes.replace("_", " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <LoanStatusBadge estado={p.estado} />
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
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
