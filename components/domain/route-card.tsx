"use client";

import { cn } from "@/components/ui/cn";
import { Badge } from "@/components/ui/badge";
import { MapPin, Circle, Check, Receipt } from "lucide-react";
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
  direccion,
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
  // "pagado" sigue siendo interactiva: abre el comprobante en vez de cobrar.
  const isInteractive = estado !== "no_encontrado";
  const ubicacion = barrio || direccion;

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "group w-full rounded-2xl border p-3 text-left transition-all duration-200 sm:p-4",
        "bg-card/90 shadow-sm shadow-black/5 backdrop-blur-sm",
        isInteractive && "cursor-pointer active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-lg",
        estado === "pendiente" && "border-warning/25 hover:border-warning/40 bg-warning/[0.04]",
        estado === "pagado" && "border-success/25 hover:border-success/40 bg-success/[0.04]",
        estado === "parcial" && "border-info/25 hover:border-info/40 bg-info/[0.04]",
        estado === "mora" && "border-danger/25 hover:border-danger/40 bg-danger/[0.04]",
        estado === "no_encontrado" && "border-border bg-muted/40",
        selected && "border-primary/50 ring-2 ring-primary/30",
        "min-h-[72px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-2.5">
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
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 transition-colors sm:h-9 sm:w-9",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              {selected && <Check className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" strokeWidth={3} />}
            </button>
          )}
          <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Circle className={cn("h-2 w-2 shrink-0 sm:h-2.5 sm:w-2.5", config.dot)} />
              <span className="truncate text-[13px] font-semibold text-foreground sm:text-[15px]">
                {clienteNombre}
              </span>
            </div>
            {ubicacion && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:gap-1.5 sm:text-xs">
                <MapPin className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                <span className="truncate">{ubicacion}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-2 self-stretch sm:flex-col sm:items-end sm:gap-1">
          <Badge variant={config.badge} className="shadow-sm text-[10px] sm:text-xs">
            {config.label}
          </Badge>
          <span className="text-[9px] text-muted-foreground whitespace-nowrap sm:text-[11px]">
            Cuota {cuotaTotal ? `${cuotaNumero}/${cuotaTotal}` : cuotaNumero}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-2 sm:mt-3 sm:gap-3 sm:pt-3">
        <div className="flex items-center justify-between gap-2 sm:flex-row sm:gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">
              Monto
            </p>
            <p className="mt-0.5 font-display text-base font-bold tabular-nums text-foreground sm:mt-1 sm:text-lg">
              {formatCop(montoPagado ?? montoEsperado)}
            </p>
          </div>
          {estado === "pagado" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success sm:gap-1.5 sm:text-xs">
              <Receipt className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
              <span className="truncate">Ver comprobante</span>
            </span>
          ) : (
            <p className="text-[10px] text-muted-foreground text-right sm:text-xs">
              Saldo {formatCop(Math.max(montoEsperado - (montoPagado ?? 0), 0))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
