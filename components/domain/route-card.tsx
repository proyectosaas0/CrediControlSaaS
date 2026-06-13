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
        "group w-full rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.99]",
        "bg-card/90 shadow-sm shadow-black/5 backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-lg",
        estado === "pendiente" && "border-warning/25 hover:border-warning/40 bg-warning/[0.04]",
        estado === "pagado" && "border-success/25 bg-success/[0.04]",
        estado === "parcial" && "border-info/25 hover:border-info/40 bg-info/[0.04]",
        estado === "mora" && "border-danger/25 hover:border-danger/40 bg-danger/[0.04]",
        estado === "no_encontrado" && "border-border bg-muted/40",
        "min-h-[72px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Circle className={cn("h-2.5 w-2.5 shrink-0", config.dot)} />
            <span className="truncate text-[15px] font-semibold text-foreground">
              {clienteNombre}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{barrio || "Sin barrio"}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={config.badge} className="shadow-sm">
            {config.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            Cuota {cuotaTotal ? `${cuotaNumero}/${cuotaTotal}` : cuotaNumero}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 border-t border-border/60 pt-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Monto
          </p>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">
            {formatCop(montoPagado ?? montoEsperado)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Saldo {formatCop(Math.max(montoEsperado - (montoPagado ?? 0), 0))}
        </p>
      </div>
    </button>
  );
}
