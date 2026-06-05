"use client";

import {
  TrendingUp,
  Activity,
  Users,
  BarChart3,
  Smartphone,
  FileText,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import {
  MOCK_SUPER_ADMIN_METRICAS,
  MOCK_CRECIMIENTO_MENSUAL,
} from "@/lib/mock/super-admin";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";

type UsoFeature = {
  label: string;
  porcentaje: number;
  icon: React.ReactNode;
};

const USO_FEATURES: UsoFeature[] = [
  {
    label: "Clientes creados",
    porcentaje: 92,
    icon: <Users className="h-4 w-4 text-primary" />,
  },
  {
    label: "Prestamos creados",
    porcentaje: 85,
    icon: <Activity className="h-4 w-4 text-success" />,
  },
  {
    label: "Pagos en linea",
    porcentaje: 78,
    icon: <CreditCard className="h-4 w-4 text-info" />,
  },
  {
    label: "Reportes usados",
    porcentaje: 65,
    icon: <FileText className="h-4 w-4 text-warning" />,
  },
  {
    label: "WhatsApp usado",
    porcentaje: 45,
    icon: <MessageSquare className="h-4 w-4 text-success" />,
  },
  {
    label: "App movil",
    porcentaje: 70,
    icon: <Smartphone className="h-4 w-4 text-primary" />,
  },
];

const RETENCION_DATA = [
  { semana: "Sem 1", porcentaje: 100 },
  { semana: "Sem 2", porcentaje: 88 },
  { semana: "Sem 3", porcentaje: 75 },
  { semana: "Sem 4", porcentaje: 62 },
  { semana: "Sem 5", porcentaje: 55 },
  { semana: "Sem 6", porcentaje: 48 },
  { semana: "Sem 7", porcentaje: 42 },
  { semana: "Sem 8", porcentaje: 37 },
];

export default function MetricasPage() {
  const m = MOCK_SUPER_ADMIN_METRICAS;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Metricas globales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analisis de uso y crecimiento de la plataforma
        </p>
      </div>

      {/* Retencion */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Retencion de usuarios
        </h2>
        <Card padding="md">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-muted-foreground">% de usuarios que continuan activos</span>
            <span className="font-medium text-foreground">Tasa: {m.tasaConversion}%</span>
          </div>
          <div className="space-y-2">
            {RETENCION_DATA.map((item) => (
              <div key={item.semana} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs text-muted-foreground">
                  {item.semana}
                </span>
                <div className="flex-1 h-5 relative">
                  <div
                    className={cn(
                      "absolute inset-y-1 rounded-sm transition-all",
                      item.porcentaje >= 70
                        ? "bg-success/50"
                        : item.porcentaje >= 50
                          ? "bg-warning/50"
                          : "bg-danger/50",
                    )}
                    style={{ width: `${item.porcentaje}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "w-10 text-right text-xs font-mono",
                    item.porcentaje >= 70
                      ? "text-success"
                      : item.porcentaje >= 50
                        ? "text-warning"
                        : "text-danger",
                  )}
                >
                  {item.porcentaje}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Crecimiento mensual */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Crecimiento mensual
        </h2>
        <Card padding="md">
          <div className="space-y-3">
            {MOCK_CRECIMIENTO_MENSUAL.map((item) => {
              const maxP = Math.max(...MOCK_CRECIMIENTO_MENSUAL.map((x) => x.prestamos));
              return (
                <div key={item.mes}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.mes}</span>
                    <span className="font-mono text-foreground">
                      {item.tenants} tenants · {item.prestamos} prestamos
                    </span>
                  </div>
                  <div className="flex gap-1 h-5">
                    <div className="flex-1 relative">
                      <div
                        className="absolute inset-y-1 bg-primary/30 rounded-sm"
                        style={{
                          width: `${(item.tenants / MOCK_CRECIMIENTO_MENSUAL[MOCK_CRECIMIENTO_MENSUAL.length - 1].tenants) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex-1 relative">
                      <div
                        className="absolute inset-y-1 bg-success/30 rounded-sm"
                        style={{
                          width: `${(item.prestamos / maxP) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/30" />
              Tenants
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-success/30" />
              Prestamos
            </span>
          </div>
        </Card>
      </div>

      {/* Uso de funcionalidades */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Uso de funcionalidades
        </h2>
        <div className="space-y-2">
          {USO_FEATURES.map((feat) => (
            <Card key={feat.label} padding="sm">
              <div className="flex items-center gap-3">
                {feat.icon}
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">{feat.label}</span>
                    <span className="font-medium text-muted-foreground">
                      {feat.porcentaje}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        feat.porcentaje >= 80
                          ? "bg-success"
                          : feat.porcentaje >= 60
                            ? "bg-primary"
                            : feat.porcentaje >= 40
                              ? "bg-warning"
                              : "bg-danger",
                      )}
                      style={{ width: `${feat.porcentaje}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Prestamos creados</p>
          <p className="text-xl font-bold text-foreground mt-1">{m.prestamosTotales}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Cobros registrados</p>
          <p className="text-xl font-bold text-foreground mt-1">{m.pagosRegistrados}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Cobradores activos</p>
          <p className="text-xl font-bold text-foreground mt-1">{m.cobradoresActivos}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Tasa conversion</p>
          <p className="text-xl font-bold text-primary mt-1">{m.tasaConversion}%</p>
        </Card>
      </div>
    </div>
  );
}
