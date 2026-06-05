"use client";

import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCop } from "@/lib/domain/money";
import { MOCK_DAILY_SUMMARY, MOCK_PAGOS_HOY } from "@/lib/mock/ruta";
import { MapPin, Banknote, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

type CobradorDashboardProps = {
  userName: string;
};

export function CobradorDashboard({ userName }: CobradorDashboardProps) {
  const summary = MOCK_DAILY_SUMMARY;
  const pctCumplimiento = summary.totalEsperado > 0
    ? Math.round((summary.totalRecaudado / summary.totalEsperado) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hola, {userName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Hoy tienes</p>
            <p className="text-2xl font-bold text-foreground">
              {summary.cobrosPendientes} cobros
            </p>
            <p className="text-lg font-semibold text-primary">
              {formatCop(summary.totalEsperado - summary.totalRecaudado)}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="/app/ruta"
            className={buttonClasses("primary", "lg") + " w-full"}
          >
            Ver mi ruta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Card padding="sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <Banknote className="h-5 w-5 text-success" />
            <p className="text-lg font-bold text-foreground">
              {formatCop(summary.totalRecaudado)}
            </p>
            <p className="text-[11px] text-muted-foreground">Recaudado</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="text-lg font-bold text-foreground">{pctCumplimiento}%</p>
            <p className="text-[11px] text-muted-foreground">Cumplimiento</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <MapPin className="h-5 w-5 text-warning" />
            <p className="text-lg font-bold text-foreground">
              {summary.cobrosPendientes}
            </p>
            <p className="text-[11px] text-muted-foreground">Pendientes</p>
          </div>
        </Card>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Ultimos pagos
          </h2>
          <Link
            href="/app/pagos"
            className="text-xs text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>
        {MOCK_PAGOS_HOY.slice(0, 3).map((pago) => (
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
                <Badge variant="success">{pago.medioPago}</Badge>
                <span className="text-sm font-semibold text-success">
                  {formatCop(pago.monto)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
