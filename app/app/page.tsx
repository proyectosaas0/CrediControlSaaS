"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { OnboardingTutorial } from "@/components/auth/onboarding-tutorial";
import { CobradorDashboard } from "@/components/domain/cobrador-dashboard";
import { useClientes, usePrestamos, useCobradores } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { formatCop } from "@/lib/domain/money";
import { MOCK_DAILY_SUMMARY } from "@/lib/mock/ruta";
import { buttonClasses } from "@/components/ui/button";
import { TrendingUp, Users, AlertTriangle, Wallet, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  const userName = user?.email?.split("@")[0] ?? "Usuario";

  const { data: clientes = [] } = useClientes();
  const { data: prestamos = [] } = usePrestamos();
  const { data: cobradores = [] } = useCobradores();

  const recentPrestamos = useMemo(
    () => prestamos.slice(0, 3),
    [prestamos],
  );

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

  const summary = MOCK_DAILY_SUMMARY;

  const prestamosActivos = prestamos.filter(
    (p) => p.estado === "activo",
  ).length;
  const enMora = prestamos.filter(
    (p) => p.estado === "en_mora",
  ).length;
  const cobradoresActivos = cobradores.filter((c) => c.activo).length;
  const clientesActivos = clientes.filter((c) => c.activo).length;

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <Wallet className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recaudo hoy</p>
              <p className="text-lg font-bold text-foreground">
                {formatCop(summary.totalRecaudado)}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prestamos activos</p>
              <p className="text-lg font-bold text-foreground">
                {prestamosActivos}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En mora</p>
              <p className="text-lg font-bold text-foreground">{enMora}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10">
              <Users className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cobradores</p>
              <p className="text-lg font-bold text-foreground">
                {cobradoresActivos}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/clientes" className={buttonClasses("outline", "sm") + " w-full"}>
          {clientesActivos} clientes
        </Link>
        <Link href="/app/prestamos" className={buttonClasses("outline", "sm") + " w-full"}>
          {prestamos.length} prestamos
        </Link>
      </div>

      {recentPrestamos.length > 0 && (
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentPrestamos.map((p) => (
              <Link key={p.id} href={`/app/prestamos/${p.id}`}>
                <Card padding="md" className="transition-colors hover:border-primary/30 cursor-pointer h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {p.clienteNombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCop(p.capital)} · {p.modeloInteres.replace("_", " ")}
                      </p>
                    </div>
                    <p
                      className={`text-xs font-medium ${
                        p.estado === "en_mora"
                          ? "text-danger"
                          : p.estado === "saldado"
                            ? "text-success"
                            : "text-primary"
                      }`}
                    >
                      {p.estado.replace("_", " ")}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
