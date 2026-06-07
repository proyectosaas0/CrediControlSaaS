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
import { TrendingUp, AlertTriangle, Wallet, ArrowRight, FileText } from "lucide-react";

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
  const recentPrestamos = prestamos?.slice(0, 3) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hola, {userName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tu cartera
        </p>
      </div>

      {(loadingResumen || loadingPrestamos) ? (
        <SkeletonGrid count={3} cols={2} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Wallet className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recaudo hoy</p>
                <p className="text-lg font-bold text-foreground">{formatCop(resumen?.recaudoTotal ?? 0)}</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prestamos activos</p>
                <p className="text-lg font-bold text-foreground">{prestamosActivos}</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                <AlertTriangle className="h-5 w-5 text-danger" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">En mora</p>
                <p className="text-lg font-bold text-foreground">{enMora}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/clientes" className={buttonClasses("outline", "sm") + " w-full"}>
          Ver clientes
        </Link>
        <Link href="/app/prestamos" className={buttonClasses("outline", "sm") + " w-full"}>
          Ver prestamos
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">
            Ultimos prestamos
          </h2>
          <Link
            href="/app/prestamos"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver todos
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loadingPrestamos ? (
          <SkeletonList count={3} />
        ) : recentPrestamos.length === 0 ? (
          <EmptyState icon={FileText} title="Sin prestamos aun" description="Crea el primer prestamo para verlo aquí." />
        ) : (
          <div className="space-y-3">
            {recentPrestamos.map((p) => (
              <Link key={p.id} href={`/app/prestamos/${p.id}`}>
                <Card padding="md" className="mb-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.clientes?.nombre ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCop(p.capital)} · {p.modelo_interes.replace("_", " ")}
                      </p>
                    </div>
                    <LoanStatusBadge estado={p.estado} />
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
