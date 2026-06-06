"use client";

import {
  Check,
  X,
  Clock,
  Gift,
  Percent,
  Building2,
} from "lucide-react";
import {
  MOCK_PLANES,
  MOCK_PAGOS_SUSCRIPCION,
  MOCK_TENANTS,
} from "@/lib/mock/super-admin";
import { formatCop } from "@/lib/domain/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { toast } from "sonner";

const estadoPagoBadge: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
  exitoso: {
    className: "bg-success/15 text-success",
    label: "Exitoso",
    icon: <Check className="h-3 w-3" />,
  },
  pendiente: {
    className: "bg-warning/15 text-warning",
    label: "Pendiente",
    icon: <Clock className="h-3 w-3" />,
  },
  fallido: {
    className: "bg-danger/15 text-danger",
    label: "Fallido",
    icon: <X className="h-3 w-3" />,
  },
};

export default function SuscripcionesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Suscripciones</h1>

      {/* Planes disponibles */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Planes disponibles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MOCK_PLANES.map((plan) => (
            <Card key={plan.id} padding="md" className="flex flex-col">
              <p className="text-sm font-semibold text-foreground">{plan.nombre}</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-2">
                {plan.precioMensual === 0
                  ? "Gratis"
                  : formatCop(plan.precioMensual)}
                {plan.precioMensual > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">/mes</span>
                )}
              </p>
              <div className="mt-3 space-y-1.5 flex-1">
                <PlanFeature label="Clientes" value={plan.clientesMax === -1 ? "Ilimitados" : plan.clientesMax} />
                <PlanFeature label="Cobradores" value={plan.cobradoresMax === -1 ? "Ilimitados" : plan.cobradoresMax} />
                <PlanFeature label="Prestamos" value={plan.prestamosMax === -1 ? "Ilimitados" : plan.prestamosMax} />
                {plan.soporteWhatsApp ? (
                  <PlanFeature label="WhatsApp" value="Incluido" ok />
                ) : (
                  <PlanFeature label="WhatsApp" value="No incluido" />
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {MOCK_TENANTS.filter((t) => t.plan === plan.id).length} tenant(s) en este plan
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Estado de suscripcion por tenant */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Estado por tenant
        </h2>
        <div className="space-y-2">
          {MOCK_TENANTS.map((t) => {
            const isActive = t.estadoSuscripcion === "activo";
            const isTrial = t.estadoSuscripcion === "trial";
            return (
              <Card key={t.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {t.nombreNegocio}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        isActive
                          ? "bg-success/15 text-success"
                          : isTrial
                            ? "bg-warning/15 text-warning"
                            : "bg-danger/15 text-danger",
                      )}
                    >
                      {isActive ? "Activo" : isTrial ? "Trial" : t.estadoSuscripcion}
                    </span>
                    {isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Mes de cortesia"
                        onClick={() => toast.success("Mes de cortesia aplicado")}
                      >
                        <Gift className="h-4 w-4" />
                      </Button>
                    )}
                    {isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Aplicar descuento"
                        onClick={() => toast.success("Descuento del 10% aplicado")}
                      >
                        <Percent className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Historial de pagos */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Historial de pagos
        </h2>
        <div className="space-y-2">
          {MOCK_PAGOS_SUSCRIPCION.map((pago) => {
            const badge = estadoPagoBadge[pago.estado];
            return (
              <Card key={pago.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {pago.tenantNombre}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="capitalize">{pago.plan}</span>
                      <span>·</span>
                      <span>{pago.fecha}</span>
                      <span>·</span>
                      <span className="capitalize">{pago.metodo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold font-mono text-foreground">
                      {formatCop(pago.monto)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        badge.className,
                      )}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ label, value, ok }: { label: string; value: string | number; ok?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <Check className="h-3.5 w-3.5 text-success shrink-0" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
