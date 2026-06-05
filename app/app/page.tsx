"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { OnboardingTutorial } from "@/components/auth/onboarding-tutorial";
import { CobradorDashboard } from "@/components/domain/cobrador-dashboard";
import { Card } from "@/components/ui/card";
import { formatCop } from "@/lib/domain/money";
import { MOCK_DAILY_SUMMARY } from "@/lib/mock/ruta";
import { TrendingUp, Users, AlertTriangle, Wallet } from "lucide-react";

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

  const summary = MOCK_DAILY_SUMMARY;

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

      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prestamos</p>
              <p className="text-lg font-bold text-foreground">42</p>
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
              <p className="text-lg font-bold text-foreground">8</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Users className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cobradores</p>
              <p className="text-lg font-bold text-foreground">3</p>
            </div>
          </div>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Dashboard admin completo — Fase 3
      </p>
    </div>
  );
}
