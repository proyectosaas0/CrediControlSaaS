"use client";

import { Building2, DollarSign, Activity } from "lucide-react";
import { useSuperAdminMetricas } from "@/hooks/queries/use-super-admin";
import { Card } from "@/components/ui/card";

export default function SuperAdminDashboardPage() {
  const { data: m, isLoading } = useSuperAdminMetricas();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel Super Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion de la plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Tenants</p>
              <p className="text-xl font-bold">{isLoading ? "—" : (m?.tenants ?? 0)}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Prestamos</p>
              <p className="text-xl font-bold">{isLoading ? "—" : (m?.prestamos ?? 0)}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-info" />
            <div>
              <p className="text-xs text-muted-foreground">Pagos</p>
              <p className="text-xl font-bold">{isLoading ? "—" : (m?.pagosRegistrados ?? 0)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
