"use client";

import { Building2, CreditCard } from "lucide-react";
import { useTenants } from "@/hooks/queries/use-super-admin";
import { Card } from "@/components/ui/card";

export default function SuscripcionesPage() {
  const { data: tenants = [], isLoading } = useTenants();

  const planCount = tenants.reduce<Record<string, number>>((acc, t) => {
    acc[t.plan] = (acc[t.plan] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Suscripciones</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(planCount).map(([plan, count]) => (
              <Card key={plan} padding="md">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">{plan}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            {tenants.map((t) => (
              <Card key={t.id} padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">{t.nombre_negocio}</p>
                      <p className="text-xs text-muted-foreground">{t.plan} · {t.estado_suscripcion}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
