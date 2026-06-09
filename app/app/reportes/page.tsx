"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Activity,
  Target,
  Download,
} from "lucide-react";
import {
  useReportesResumen,
  useRecaudoDiario,
  useReportesCobradores,
  useCarteraRiesgo,
  useProyeccion,
} from "@/hooks/queries/use-reportes";
import { useCobradores } from "@/hooks/queries/use-cobradores";
import { formatCop } from "@/lib/domain/money";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
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
  const [desdeManual, setDesdeManual] = useState("2026-06-01");
  const [hastaManual, setHastaManual] = useState("2026-06-05");

  const { desde, hasta } = useMemo(() => {
    if (periodo === "rango") return { desde: desdeManual, hasta: hastaManual };
    const today = new Date();
    const h = today.toISOString().slice(0, 10);
    if (periodo === "hoy") return { desde: h, hasta: h };
    if (periodo === "semana") {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { desde: d.toISOString().slice(0, 10), hasta: h };
    }
    const d = new Date(today);
    d.setDate(1);
    return { desde: d.toISOString().slice(0, 10), hasta: h };
  }, [periodo, desdeManual, hastaManual]);

  const rango = { desde, hasta };
  const { data: metricas } = useReportesResumen(rango);
  const { data: recaudoDiario = [], isLoading: loadingChart } = useRecaudoDiario(rango);
  const { data: cobradoresRendimiento = [] } = useReportesCobradores(rango);
  const { data: cartera } = useCarteraRiesgo();
  const { data: proyeccion } = useProyeccion(30);
  const { data: cobradores = [] } = useCobradores({ activo: true });

  const rendimientoFiltrado =
    cobradorFiltro === "todos"
      ? cobradoresRendimiento
      : cobradoresRendimiento.filter((r) => r.cobrador_id === cobradorFiltro);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("CSV exportado")}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("PDF exportado")}
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
                  onChange={(e) => setDesdeManual(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHastaManual(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}

          <div>
            <Select
              label="Cobrador"
              value={cobradorFiltro}
              onChange={(e) => setCobradorFiltro(e.target.value)}
              options={[
                { value: "todos", label: "Todos los cobradores" },
                ...cobradores.map((c) => ({ value: c.id, label: c.nombre_completo })),
              ]}
            />
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
            {formatCop(metricas?.recaudoTotal ?? 0)}
          </p>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <p className="text-xs text-muted-foreground">Mora activa</p>
          </div>
          <p className="text-lg font-bold font-mono text-danger mt-1">
            {formatCop(cartera?.montoTotal ?? 0)}
          </p>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Prestamos activos</p>
          </div>
          <p className="text-lg font-bold text-primary mt-1">
            {metricas?.prestamosActivos ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            En mora: {metricas?.prestamosEnMora ?? 0}
          </p>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Proyeccion 30 dias</p>
          </div>
          <p className="text-lg font-bold text-primary mt-1">
            {formatCop(proyeccion?.total ?? 0)}
          </p>
        </Card>
      </div>

      {/* Recaudo diario */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Recaudo diario
        </h2>
        <Card padding="md">
          {loadingChart ? (
            <p className="text-center text-sm text-muted-foreground py-4">Cargando...</p>
          ) : recaudoDiario.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Sin datos para el periodo</p>
          ) : (
            <div className="space-y-2">
              {recaudoDiario.map((d) => {
                const maxEsperado = Math.max(...recaudoDiario.map((x) => x.esperado));
                const barWidth = maxEsperado > 0 ? (d.recaudado / maxEsperado) * 100 : 0;
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
                          d.recaudado >= d.esperado ? "bg-success" : d.recaudado > 0 ? "bg-primary" : "bg-muted-foreground/20",
                        )}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-xs font-mono text-foreground">
                      {formatCop(d.recaudado)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Rendimiento por cobrador */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Rendimiento por cobrador
        </h2>
        {rendimientoFiltrado.length === 0 ? (
          <Card padding="md">
            <p className="text-center text-sm text-muted-foreground">Sin datos para el periodo</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {rendimientoFiltrado.map((c, i) => (
              <Card key={`${c.cobrador_id}-${i}`} padding="md">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {c.cobrador_id}
                  </p>
                  <span className="font-mono text-sm text-foreground">
                    {formatCop(c.total)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cartera en riesgo */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Cartera en riesgo
        </h2>
        <Card padding="md">
          {cartera ? (
            <div className="space-y-2">
              {[
                { label: "Mora leve (3+ dias)", monto: cartera.mayorA3 },
                { label: "Mora moderada (7+ dias)", monto: cartera.mayorA7 },
                { label: "Mora severa (15+ dias)", monto: cartera.mayorA15 },
              ].map((item) => {
                const maxMonto = Math.max(cartera.mayorA3, cartera.mayorA7, cartera.mayorA15, 1);
                const width = (item.monto / maxMonto) * 100;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground">{item.label}</span>
                      <span className="font-mono text-muted-foreground">
                        {formatCop(item.monto)}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted">
                      <div
                        className="h-2.5 rounded-full bg-danger"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground pt-1">
                Total en riesgo: {formatCop(cartera.montoTotal)}
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">Sin datos</p>
          )}
        </Card>
      </div>
    </div>
  );
}
