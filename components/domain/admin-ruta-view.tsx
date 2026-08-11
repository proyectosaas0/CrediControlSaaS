"use client";

import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatCop } from "@/lib/domain/money";
import { useAuth } from "@/providers/auth-provider";
import { useCobradores } from "@/hooks/queries/use-cobradores";
import { useRutaHoy } from "@/hooks/queries/use-ruta";

type CobradorProgress = {
  id: string;
  nombre: string;
  total: number;
  realizados: number;
  recaudado: number;
};

export function AdminRutaView() {
  const { effectiveOrgId } = useAuth();
  const { data: cobradores = [], isLoading: loadingCobradores } = useCobradores({
    activo: true,
  });
  const { data: cuotas = [], isLoading: loadingRuta } = useRutaHoy(undefined, {
    enabled: !!effectiveOrgId,
  });

  const isLoading = loadingCobradores || loadingRuta;

  const progress: CobradorProgress[] = cobradores
    .map((cobrador) => {
      const asignadas = cuotas.filter((c) => c.cobrador_id === cobrador.id);
      return {
        id: cobrador.id,
        nombre: cobrador.nombre_completo,
        total: asignadas.length,
        realizados: asignadas.filter((c) => c.estado === "pagado" || c.estado === "parcial")
          .length,
        recaudado: asignadas.reduce((sum, c) => sum + (c.monto_pagado ?? 0), 0),
      };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Ruta del día
        </h1>
        <p className="text-sm text-muted-foreground">
          Progreso de cobradores en tiempo real
        </p>
      </div>

      {isLoading ? (
        <Card padding="md" className="py-12 text-center">
          <p className="text-sm font-medium text-foreground">Cargando la ruta de hoy...</p>
        </Card>
      ) : progress.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Sin cobros programados"
          description="Ningún cobrador tiene cuotas asignadas para hoy."
        />
      ) : (
        <div className="space-y-3">
          {progress.map((c) => {
            const pct = c.total > 0 ? Math.round((c.realizados / c.total) * 100) : 0;
            return (
              <Card
                key={c.id}
                padding="md"
                className="overflow-hidden border-border/80 bg-card/90 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{c.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.realizados} de {c.total} cobros
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold tabular-nums text-success">
                      {formatCop(c.recaudado)}
                    </p>
                    <Badge
                      variant={pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger"}
                      className="shadow-sm"
                    >
                      {pct}%
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
