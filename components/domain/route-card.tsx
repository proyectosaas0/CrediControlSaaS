"use client";

import { cn } from "@/components/ui/cn";
import { Badge } from "@/components/ui/badge";
import { MapPin, Circle } from "lucide-react";
import { formatCop } from "@/lib/domain/money";
import type { RouteItem, RouteItemStatus } from "@/lib/mock/ruta";

const STATUS_CONFIG: Record<
  RouteItemStatus,
  { dot: string; badge: "warning" | "success" | "info" | "danger" | "muted"; label: string }
> = {
  pendiente: { dot: "fill-cobrador-pending text-cobrador-pending", badge: "warning", label: "Pendiente" },
  pagado: { dot: "fill-cobrador-paid text-cobrador-paid", badge: "success", label: "Pagado" },
  parcial: { dot: "fill-info text-info", badge: "info", label: "Parcial" },
  mora: { dot: "fill-danger text-danger", badge: "danger", label: "En mora" },
  no_encontrado: { dot: "fill-muted-foreground text-muted-foreground", badge: "muted", label: "No encontrado" },
};

type RouteCardProps = RouteItem & {
  onClick: () => void;
};

export function RouteCard({
  clienteNombre,
  barrio,
  montoEsperado,
  montoPagado,
  cuotaNumero,
  cuotaTotal,
  estado,
  onClick,
}: RouteCardProps) {
  const config = STATUS_CONFIG[estado];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all active:scale-[0.98]",
        estado === "pendiente" && "border-warning/30 bg-warning/5 hover:bg-warning/10",
        estado === "pagado" && "border-success/30 bg-success/5",
        estado === "parcial" && "border-info/30 bg-info/5 hover:bg-info/10",
        estado === "mora" && "border-danger/30 bg-danger/5 hover:bg-danger/10",
        estado === "no_encontrado" && "border-border bg-muted/50",
        "min-h-[72px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Circle className={cn("h-2.5 w-2.5 shrink-0", config.dot)} />
            <span className="truncate text-sm font-semibold text-foreground">
              {clienteNombre}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{barrio}</span>
            <span aria-hidden="true">&middot;</span>
            <span className="shrink-0 font-medium text-foreground">
              {formatCop(montoPagado ?? montoEsperado)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={config.badge}>{config.label}</Badge>
          <span className="text-[11px] text-muted-foreground">
            Cuota {cuotaNumero}/{cuotaTotal}
          </span>
        </div>
      </div>
    </button>
  );
}
