"use client";

import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCop } from "@/lib/domain/money";
import { useRutaHoy } from "@/hooks/queries/use-ruta";
import { usePagos } from "@/hooks/queries/use-pagos";
import { MapPin, Banknote, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

type CobradorDashboardProps = {
  userName: string;
};

export function CobradorDashboard({ userName }: CobradorDashboardProps) {
  const { data: rutaItems = [], isLoading: loadingRuta } = useRutaHoy();
  const { data: pagos = [] } = usePagos();

  const totalEsperado = rutaItems.reduce((acc, i) => acc + i.monto_esperado, 0);
  const totalRecaudado = rutaItems.reduce((acc, i) => acc + i.monto_pagado, 0);
  const cobrosPendientes = rutaItems.filter(
    (i) => i.estado === "pendiente" || i.estado === "parcial" || i.estado === "mora",
  ).length;
  const pctCumplimiento = totalEsperado > 0
    ? Math.round((totalRecaudado / totalEsperado) * 100)
    : 0;
  const ultimosPagos = pagos.slice(0, 3);

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
            {loadingRuta ? (
              <p className="text-2xl font-bold text-foreground">Cargando tu día…</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {cobrosPendientes} cobros
                </p>
                <p className="text-lg font-semibold text-primary">
                  {formatCop(totalEsperado - totalRecaudado)}
                </p>
              </>
            )}
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
              {formatCop(totalRecaudado)}
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
              {cobrosPendientes}
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
        {ultimosPagos.length === 0 ? (
          <Card padding="sm">
            <p className="text-sm text-muted-foreground">Sin pagos registrados aún.</p>
          </Card>
        ) : (
          ultimosPagos.map((pago) => (
            <Card key={pago.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {pago.clientes?.nombre ?? "Cliente"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(pago.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{pago.medio_pago}</Badge>
                  <span className="text-sm font-semibold text-success">
                    {formatCop(pago.monto)}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
