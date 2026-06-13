"use client";

import { Building2, CreditCard } from "lucide-react";
import { useTenants } from "@/hooks/queries/use-super-admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, staggerDelay } from "@/components/ui/page-header";
import { PlatformStat } from "@/components/ui/platform-stat";
import { SkeletonList } from "@/components/ui/skeleton";

const ESTADO_VARIANT: Record<string, "success" | "warning" | "danger" | "muted"> = {
  activa: "success",
  prueba: "warning",
  vencida: "danger",
  suspendida: "danger",
};

export default function SuscripcionesPage() {
  const { data: tenants = [], isLoading } = useTenants();

  const planCount = tenants.reduce<Record<string, number>>((acc, t) => {
    acc[t.plan] = (acc[t.plan] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plataforma"
        title="Suscripciones"
        subtitle={
          isLoading
            ? "Cargando suscripciones…"
            : `${tenants.length} negocio${tenants.length !== 1 ? "s" : ""} suscritos`
        }
      />

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(planCount).map(([plan, count], i) => (
              <PlatformStat
                key={plan}
                icon={CreditCard}
                label={plan}
                value={count}
                chip="bg-primary/15 text-primary"
                delay={60 + i * 60}
              />
            ))}
          </div>

          <div className="space-y-2.5">
            {tenants.map((t, i) => (
              <Card
                key={t.id}
                padding="md"
                className="dash-rise"
                style={staggerDelay(i, 45, 360)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {t.nombre_negocio}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">
                        Plan {t.plan}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={ESTADO_VARIANT[t.estado_suscripcion] ?? "muted"}
                    className="capitalize"
                  >
                    {t.estado_suscripcion}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
