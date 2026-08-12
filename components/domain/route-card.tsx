"use client";

import { cn } from "@/components/ui/cn";
import { Badge } from "@/components/ui/badge";
import { MapPin, Circle, Check } from "lucide-react";
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
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
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
  selectable = false,
  selected = false,
  onSelectChange,
}: RouteCardProps) {
  const config = STATUS_CONFIG[estado];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group w-full cursor-pointer rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.99]",
        "bg-card/90 shadow-sm shadow-black/5 backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-lg",
        estado === "pendiente" && "border-warning/25 hover:border-warning/40 bg-warning/[0.04]",
        estado === "pagado" && "border-success/25 bg-success/[0.04]",
        estado === "parcial" && "border-info/25 hover:border-info/40 bg-info/[0.04]",
        estado === "mora" && "border-danger/25 hover:border-danger/40 bg-danger/[0.04]",
        estado === "no_encontrado" && "border-border bg-muted/40",
        selected && "border-primary/50 ring-2 ring-primary/30",
        "min-h-[72px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          {selectable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectChange?.(!selected);
              }}
              aria-pressed={selected}
              aria-label={selected ? "Quitar de la selección" : "Seleccionar para cobrar"}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              {selected && <Check className="h-4 w-4" strokeWidth={3} />}
            </button>
          )}
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
    </div>
  );
}
