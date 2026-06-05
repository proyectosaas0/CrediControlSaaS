"use client";

import {
  Building2,
  CreditCard,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  Activity,
} from "lucide-react";
import {
  MOCK_SUPER_ADMIN_METRICAS,
  MOCK_CRECIMIENTO_MENSUAL,
  MOCK_ACTIVIDAD_RECIENTE,
} from "@/lib/mock/super-admin";
import { formatCop } from "@/lib/domain/money";
import { Card } from "@/components/ui/card";

const tipoIconMap: Record<string, React.ReactNode> = {
  registro: <Users className="h-3.5 w-3.5 text-info" />,
  prestamo: <Activity className="h-3.5 w-3.5 text-primary" />,
  pago: <DollarSign className="h-3.5 w-3.5 text-success" />,
  suspension: <AlertTriangle className="h-3.5 w-3.5 text-danger" />,
  activacion: <CreditCard className="h-3.5 w-3.5 text-success" />,
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "Hace unos minutos";
  if (diffH === 1) return "Hace 1 hora";
  if (diffH < 24) return `Hace ${diffH} horas`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Ayer";
  return `Hace ${diffD} dias`;
}

export default function SuperAdminDashboardPage() {
  const m = MOCK_SUPER_ADMIN_METRICAS;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel Super Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion de la plataforma</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="md">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Tenants activos</p>
          </div>
          <p className="text-lg font-bold text-foreground mt-1">
            {m.tenantsActivos}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              / {m.tenantsTotales}
            </span>
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            <p className="text-xs text-muted-foreground">En trial</p>
          </div>
          <p className="text-lg font-bold text-warning mt-1">{m.tenantsTrial}</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <p className="text-xs text-muted-foreground">Suspendidos</p>
          </div>
          <p className="text-lg font-bold text-danger mt-1">{m.tenantsSuspendidos}</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" />
            <p className="text-xs text-muted-foreground">Ingresos estimados</p>
          </div>
          <p className="text-lg font-bold font-mono text-success mt-1">
            {formatCop(m.ingresosEstimados)}
          </p>
        </Card>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Tasa de conversion</p>
          <p className="text-lg font-bold text-primary mt-1">{m.tasaConversion}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Trial → Pago</p>
        </Card>

        <Card padding="md">
          <p className="text-xs text-muted-foreground">Prestamos totales</p>
          <p className="text-lg font-bold text-foreground mt-1">{m.prestamosTotales}</p>
        </Card>

        <Card padding="md">
          <p className="text-xs text-muted-foreground">Pagos registrados</p>
          <p className="text-lg font-bold text-foreground mt-1">{m.pagosRegistrados}</p>
        </Card>

        <Card padding="md">
          <p className="text-xs text-muted-foreground">Cobradores activos</p>
          <p className="text-lg font-bold text-foreground mt-1">{m.cobradoresActivos}</p>
        </Card>
      </div>

      {/* Crecimiento mensual */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Crecimiento mensual
        </h2>
        <Card padding="md">
          <div className="space-y-2">
            {MOCK_CRECIMIENTO_MENSUAL.map((item) => {
              const maxT = Math.max(...MOCK_CRECIMIENTO_MENSUAL.map((x) => x.tenants));
              return (
                <div key={item.mes} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-xs text-muted-foreground">
                    {item.mes}
                  </span>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="flex-1 h-4 relative">
                      <div
                        className="absolute inset-y-1 bg-primary/20 rounded-sm"
                        style={{ width: `${(item.tenants / maxT) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-mono text-primary">
                      {item.tenants}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/20" />
              Tenants
            </span>
            <span>+{m.crecimientoMensual}% este mes</span>
          </div>
        </Card>
      </div>

      {/* Actividad reciente */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Actividad reciente
        </h2>
        <div className="space-y-2">
          {MOCK_ACTIVIDAD_RECIENTE.map((act) => (
            <Card key={act.id} padding="sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {tipoIconMap[act.tipo] ?? <Activity className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{act.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {act.tenantNombre} · {timeAgo(act.fecha)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
