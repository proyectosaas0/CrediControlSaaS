"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCop } from "@/lib/domain/money";
import { MOCK_ROUTE_ITEMS } from "@/lib/mock/ruta";

type CobradorProgress = {
  nombre: string;
  total: number;
  realizados: number;
  recaudado: number;
};

const MOCK_COBRADORES_PROGRESS: CobradorProgress[] = [
  {
    nombre: "Juan Perez",
    total: MOCK_ROUTE_ITEMS.length,
    realizados: MOCK_ROUTE_ITEMS.filter((i) => i.estado === "pagado" || i.estado === "parcial").length,
    recaudado: MOCK_ROUTE_ITEMS.reduce((sum, i) => sum + (i.montoPagado ?? 0), 0),
  },
];

export function AdminRutaView() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Ruta del dia</h1>
        <p className="text-sm text-muted-foreground">
          Progreso de cobradores en tiempo real
        </p>
      </div>

      <div className="space-y-2">
        {MOCK_COBRADORES_PROGRESS.map((c) => {
          const pct = c.total > 0 ? Math.round((c.realizados / c.total) * 100) : 0;
          return (
            <Card key={c.nombre} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{c.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.realizados} de {c.total} cobros
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-success">
                    {formatCop(c.recaudado)}
                  </p>
                  <Badge variant={pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger"}>
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
    </div>
  );
}
