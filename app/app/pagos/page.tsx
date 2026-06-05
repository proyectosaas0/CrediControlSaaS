"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { MOCK_PAGOS_HOY } from "@/lib/mock/ruta";
import { formatCop } from "@/lib/domain/money";
import { Banknote } from "lucide-react";

export default function PagosPage() {
  const pagos = MOCK_PAGOS_HOY;

  const totalDia = pagos.reduce((sum, p) => sum + p.monto, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Pagos de hoy</h1>
        <p className="text-sm text-muted-foreground">
          {pagos.length} pagos &middot; Total: {formatCop(totalDia)}
        </p>
      </div>

      {pagos.length === 0 ? (
        <EmptyState
          icon={<Banknote className="h-10 w-10" />}
          title="Sin pagos hoy"
          description="Aun no has registrado pagos en el dia de hoy."
        />
      ) : (
        <div className="space-y-2">
          {pagos.map((pago) => (
            <Card key={pago.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {pago.clienteNombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pago.fecha} · Cuota {pago.cuota}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      pago.medioPago === "efectivo"
                        ? "success"
                        : pago.medioPago === "nequi"
                          ? "info"
                          : "primary"
                    }
                  >
                    {pago.medioPago}
                  </Badge>
                  <span className="text-sm font-semibold text-success">
                    {formatCop(pago.monto)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
