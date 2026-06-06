"use client";

import { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Activity,
  Target,
  Download,
} from "lucide-react";
import {
  MOCK_RECAUDO_DIARIO,
  MOCK_COBRADOR_RENDIMIENTO,
  MOCK_MEDIO_PAGO_DISTRIBUCION,
  MOCK_CARTERA_RIESGO,
  MOCK_RESUMEN_METRICAS,
  MOCK_PROYECCION,
} from "@/lib/mock/reportes";
import { MOCK_COBRADORES } from "@/lib/mock/admin";
import { formatCop } from "@/lib/domain/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { toast } from "sonner";

type Periodo = "hoy" | "semana" | "mes" | "rango";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
];

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [cobradorFiltro, setCobradorFiltro] = useState<string>("todos");
  const [desde, setDesde] = useState("2026-06-01");
  const [hasta, setHasta] = useState("2026-06-05");

  const metricas = MOCK_RESUMEN_METRICAS;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("CSV exportado (mock)")}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("PDF exportado (mock)")}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card padding="md">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Periodo</p>
            <div className="flex gap-2">
              {PERIODOS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriodo(p.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    periodo === p.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {periodo === "rango" && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground">Cobrador</label>
            <select
              value={cobradorFiltro}
              onChange={(e) => setCobradorFiltro(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="todos">Todos los cobradores</option>
              {MOCK_COBRADORES.filter((c) => c.activo).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Metricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="md">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <p className="text-xs text-muted-foreground">Recaudo del periodo</p>
          </div>
          <p className="text-lg font-bold font-mono text-success mt-1">
            {formatCop(metricas.recaudoTotal)}
          </p>
          <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-success"
              style={{ width: `${metricas.recaudoPorcentaje}%` }}
            />
          </div>
         <p className="text-xs text-muted-foreground mt-0.5">
            {metricas.recaudoPorcentaje}% de {formatCop(metricas.recaudoEsperado)}
          </p>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <p className="text-xs text-muted-foreground">Mora activa</p>
          </div>
          <p className="text-lg font-bold font-mono text-danger mt-1">
            {formatCop(metricas.moraMonto)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {metricas.clientesEnMora} clientes
          </p>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Prestamos activos</p>
          </div>
          <p className="text-lg font-bold text-primary mt-1">
            {metricas.prestamosActivos}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Capital activo: {formatCop(metricas.capitalActivo)}
          </p>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Efectividad de cobro</p>
          </div>
          <p className="text-lg font-bold text-primary mt-1">
            {metricas.efectividadCobro}%
          </p>
        </Card>
      </div>

      {/* Recaudo diario */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Recaudo diario
        </h2>
        <Card padding="md">
          <div className="space-y-2">
            {MOCK_RECAUDO_DIARIO.map((d) => {
              const maxEsperado = Math.max(...MOCK_RECAUDO_DIARIO.map((x) => x.esperado));
              const barWidth = maxEsperado > 0 ? (d.recaudo / maxEsperado) * 100 : 0;
              const esperadoWidth = maxEsperado > 0 ? (d.esperado / maxEsperado) * 100 : 0;
              return (
                <div key={d.fecha} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">
                    {d.fecha.slice(5)}
                  </span>
                  <div className="flex-1 relative h-5">
                    <div
                      className="absolute inset-y-1 bg-muted rounded-sm"
                      style={{ width: `${esperadoWidth}%` }}
                    />
                    <div
                      className={cn(
                        "absolute inset-y-1 rounded-sm",
                        d.recaudo >= d.esperado ? "bg-success" : d.recaudo > 0 ? "bg-primary" : "bg-muted-foreground/20",
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs font-mono text-foreground">
                    {formatCop(d.recaudo)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Rendimiento por cobrador */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Rendimiento por cobrador
        </h2>
        <div className="space-y-2">
          {MOCK_COBRADOR_RENDIMIENTO.map((cb) => (
            <Card key={cb.cobradorId} padding="md">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">
                  {cb.cobradorNombre}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    cb.efectividad >= 90
                      ? "bg-success/15 text-success"
                      : cb.efectividad >= 75
                        ? "bg-warning/15 text-warning"
                        : "bg-danger/15 text-danger",
                  )}
                >
                  {cb.efectividad}% efectividad
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{cb.clientesActivos} clientes</span>
                <span>Recaudo: {formatCop(cb.recaudoPeriodo)}</span>
                <span>Esperado: {formatCop(cb.esperadoPeriodo)}</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-muted">
                <div
                  className={cn(
                    "h-2 rounded-full",
                    cb.efectividad >= 90
                      ? "bg-success"
                      : cb.efectividad >= 75
                        ? "bg-warning"
                        : "bg-danger",
                  )}
                  style={{ width: `${Math.min(cb.efectividad, 100)}%` }}
                />
              </div>
              {cb.moraGenerada > 0 && (
                <p className="mt-1 text-xs text-danger">
                  Mora generada: {formatCop(cb.moraGenerada)}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Distribucion por medio de pago */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Distribucion por medio de pago
        </h2>
        <Card padding="md">
          <div className="space-y-3">
            {MOCK_MEDIO_PAGO_DISTRIBUCION.map((item) => (
              <div key={item.medio}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground">{item.medio}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatCop(item.monto)} ({item.porcentaje}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-3 rounded-full",
                      item.medio === "Efectivo"
                        ? "bg-success"
                        : item.medio === "Nequi"
                          ? "bg-primary"
                          : "bg-info",
                    )}
                    style={{ width: `${item.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Cartera en riesgo */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Cartera en riesgo
        </h2>
        <Card padding="md">
          <div className="space-y-2">
            {MOCK_CARTERA_RIESGO.map((item) => {
              const maxMonto = Math.max(...MOCK_CARTERA_RIESGO.map((x) => x.monto));
              const width = maxMonto > 0 ? (item.monto / maxMonto) * 100 : 0;
              return (
                <div key={item.categoria}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">{item.categoria}</span>
                    <span className="font-mono text-muted-foreground">
                      {item.clientes} clientes · {formatCop(item.monto)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted">
                    <div
                      className="h-2.5 rounded-full"
                      style={{ width: `${width}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Proyeccion 30 dias */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Proyeccion 30 dias
        </h2>
        <Card padding="md">
          <div className="space-y-2">
            {MOCK_PROYECCION.map((p) => {
              const maxProy = Math.max(...MOCK_PROYECCION.map((x) => x.proyectado));
              const width = maxProy > 0 ? (p.proyectado / maxProy) * 100 : 0;
              return (
                <div key={p.fecha} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">
                    {p.fecha.slice(5)}
                  </span>
                  <div className="flex-1 h-4 relative">
                    <div
                      className="absolute inset-y-0.5 bg-info/30 rounded-sm"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-24 text-right text-xs font-mono text-foreground">
                    {formatCop(p.proyectado)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
