"use client";

import { Building2, DollarSign, Activity } from "lucide-react";
import { useSuperAdminMetricas } from "@/hooks/queries/use-super-admin";
import { PageHeader } from "@/components/ui/page-header";
import { PlatformStat } from "@/components/ui/platform-stat";

export default function SuperAdminDashboardPage() {
  const { data: m, isLoading } = useSuperAdminMetricas();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plataforma"
        title="Panel Super Admin"
        subtitle="Gestión global de la plataforma"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformStat
          icon={Building2}
          label="Tenants"
          value={isLoading ? "—" : (m?.tenants ?? 0)}
          chip="bg-primary/15 text-primary"
          delay={60}
        />
        <PlatformStat
          icon={Activity}
          label="Préstamos"
          value={isLoading ? "—" : (m?.prestamos ?? 0)}
          chip="bg-success/15 text-success"
          delay={120}
        />
        <PlatformStat
          icon={DollarSign}
          label="Pagos"
          value={isLoading ? "—" : (m?.pagosRegistrados ?? 0)}
          chip="bg-info/15 text-info"
          delay={180}
        />
      </div>
    </div>
  );
}
