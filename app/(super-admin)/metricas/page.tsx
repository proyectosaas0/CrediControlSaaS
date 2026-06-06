"use client";

import { Building2, Activity, DollarSign } from "lucide-react";
import { useSuperAdminMetricas } from "@/hooks/queries/use-super-admin";
import { Card } from "@/components/ui/card";

export default function MetricasPage() {
  const { data: m, isLoading } = useSuperAdminMetricas();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Métricas</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Tenants activos</p>
          <p className="text-2xl font-bold mt-1">{isLoading ? "—" : (m?.tenants ?? 0)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Prestamos</p>
          <p className="text-2xl font-bold mt-1">{isLoading ? "—" : (m?.prestamos ?? 0)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Pagos registrados</p>
          <p className="text-2xl font-bold mt-1">{isLoading ? "—" : (m?.pagosRegistrados ?? 0)}</p>
        </Card>
      </div>
    </div>
  );
}
