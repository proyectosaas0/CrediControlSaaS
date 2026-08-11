"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Activity,
  Target,
  Download,
  Trophy,
} from "lucide-react";
import {
  useReportesResumen,
  useRecaudoDiario,
  useReportesCobradores,
  useCarteraRiesgo,
  useProyeccion,
  type RecaudoDiario,
} from "@/hooks/queries/use-reportes";
import { useCobradores } from "@/hooks/queries/use-cobradores";
import { formatCop } from "@/lib/domain/money";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  PageHeader,
  SectionHead,
  FilterPills,
} from "@/components/ui/page-header";
import { cn } from "@/components/ui/cn";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

type Periodo = "hoy" | "semana" | "mes" | "rango";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "rango", label: "Personalizado" },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [cobradorFiltro, setCobradorFiltro] = useState<string>("todos");
  const [desdeManual, setDesdeManual] = useState(isoDaysAgo(6));
  const [hastaManual, setHastaManual] = useState(isoDaysAgo(0));

  const { desde, hasta } = useMemo(() => {
    if (periodo === "rango") return { desde: desdeManual, hasta: hastaManual };
    const today = new Date();
    const h = today.toISOString().slice(0, 10);
    if (periodo === "hoy") return { desde: h, hasta: h };
    if (periodo === "semana") return { desde: isoDaysAgo(6), hasta: h };
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

  const nombreCobrador = (id: string) =>
    cobradores.find((c) => c.id === id)?.nombre_completo ?? `Cobrador ${id.slice(0, 8)}`;

  const rendimientoFiltrado = (
    cobradorFiltro === "todos"
      ? cobradoresRendimiento
      : cobradoresRendimiento.filter((r) => r.cobrador_id === cobradorFiltro)
  )
    .slice()
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Análisis"
        title="Reportes"
        subtitle="Métricas y rendimiento de tu operación"
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => toast.success("CSV exportado")}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => toast.success("PDF exportado")}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </>
        }
      />

      {/* Filtros */}
      <Card padding="md" className="dash-rise" style={{ animationDelay: "60ms" }}>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Periodo
            </p>
            <FilterPills options={PERIODOS} value={periodo} onChange={setPeriodo} />
          </div>

          {periodo === "rango" && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Desde</label>
                <input
                  type="date"
                  value={desdeManual}
                  max={hastaManual}
                  onChange={(e) => setDesdeManual(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Hasta</label>
                <input
                  type="date"
                  value={hastaManual}
                  min={desdeManual}
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReporteStat
          icon={TrendingUp}
          label="Recaudo del periodo"
          value={formatCop(metricas?.recaudoTotal ?? 0)}
          accent="emerald"
          delay={100}
        />
        <ReporteStat
          icon={AlertTriangle}
          label="Mora activa"
          value={formatCop(cartera?.montoTotal ?? 0)}
          accent={(cartera?.montoTotal ?? 0) > 0 ? "rose" : "muted"}
          delay={150}
        />
        <ReporteStat
          icon={Activity}
          label="Préstamos activos"
          value={metricas?.prestamosActivos ?? 0}
          foot={`En mora: ${metricas?.prestamosEnMora ?? 0}`}
          accent="indigo"
          delay={200}
        />
        <ReporteStat
          icon={Target}
          label="Proyección 30 días"
          value={formatCop(proyeccion?.total ?? 0)}
          accent="sky"
          delay={250}
        />
      </div>

      {/* Recaudo diario + Cartera en riesgo */}
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="dash-rise lg:col-span-8" style={{ animationDelay: "300ms" }}>
          <SectionHead title="Recaudo diario" />
          <RecaudoChart data={recaudoDiario} loading={loadingChart} />
        </div>

        <div className="dash-rise lg:col-span-4" style={{ animationDelay: "360ms" }}>
          <SectionHead title="Cartera en riesgo" />
          <CarteraRiesgoCard cartera={cartera} />
        </div>
      </div>

      {/* Rendimiento por cobrador */}
      <div className="dash-rise" style={{ animationDelay: "420ms" }}>
        <SectionHead title="Rendimiento por cobrador" count={rendimientoFiltrado.length || undefined} />
        <RendimientoLeaderboard filas={rendimientoFiltrado} nombreCobrador={nombreCobrador} />
      </div>
    </div>
  );
}

/* ─────────────────────────── Stat tiles ─────────────────────────── */

type Accent = "indigo" | "emerald" | "rose" | "sky" | "muted";

const accentMap: Record<Accent, { icon: string; ring: string }> = {
  indigo: {
    icon: "bg-gradient-to-br from-primary/25 via-primary/10 to-transparent text-primary",
    ring: "ring-primary/15",
  },
  emerald: {
    icon: "bg-gradient-to-br from-success/25 via-success/10 to-transparent text-success",
    ring: "ring-success/15",
  },
  rose: {
    icon: "bg-gradient-to-br from-danger/25 via-danger/10 to-transparent text-danger",
    ring: "ring-danger/15",
  },
  sky: {
    icon: "bg-gradient-to-br from-info/25 via-info/10 to-transparent text-info",
    ring: "ring-info/15",
  },
  muted: {
    icon: "bg-muted text-muted-foreground",
    ring: "ring-border",
  },
};

function ReporteStat({
  icon: Icon,
  label,
  value,
  foot,
  accent,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  foot?: string;
  accent: Accent;
  delay: number;
}) {
  const a = accentMap[accent];
  return (
    <div
      className="dash-rise rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/[0.03] backdrop-blur-sm dark:shadow-black/20"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset", a.icon, a.ring)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-right text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-3 truncate font-display text-2xl font-bold leading-none tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      {foot && <p className="mt-1.5 text-xs text-muted-foreground">{foot}</p>}
    </div>
  );
}

/* ─────────────────────────── Recaudo diario (chart) ─────────────────────────── */

function RecaudoChart({ data, loading }: { data: RecaudoDiario[]; loading: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (loading) {
    return (
      <Card padding="md">
        <div className="flex h-56 items-end gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t-[3px] bg-muted"
              style={{ height: `${20 + ((i * 37) % 60)}%` }}
            />
          ))}
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card padding="md">
        <p className="py-10 text-center text-sm text-muted-foreground">
          Sin datos para el periodo
        </p>
      </Card>
    );
  }

  const max = Math.max(...data.map((d) => Math.max(d.recaudado, d.esperado)), 1);
  const showEveryLabel = data.length <= 9;
  const labelStep = Math.ceil(data.length / 9);
  const todayIso = new Date().toISOString().slice(0, 10);
  const active = hovered !== null ? data[hovered] : null;

  return (
    <Card padding="md">
      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gradient-to-br from-primary to-violet-400" />
          Recaudado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted ring-1 ring-inset ring-border" />
          Esperado
        </span>
        {active && (
          <span className="ml-auto flex items-center gap-3 rounded-lg bg-muted px-2.5 py-1 font-medium text-foreground">
            <span>{new Date(`${active.fecha}T12:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
            <span className="tabular-nums text-primary">{formatCop(active.recaudado)}</span>
            <span className="tabular-nums text-muted-foreground/70">/ {formatCop(active.esperado)}</span>
          </span>
        )}
      </div>

      <div className="flex h-56 items-end gap-1">
        {data.map((d, i) => {
          const isToday = d.fecha === todayIso;
          const hRecaudado = Math.max((d.recaudado / max) * 100, d.recaudado > 0 ? 3 : 0);
          const hEsperado = Math.max((d.esperado / max) * 100, d.esperado > 0 ? 3 : 0);
          const showLabel = showEveryLabel || i % labelStep === 0 || i === data.length - 1;
          const dia = new Date(`${d.fecha}T12:00:00`).toLocaleDateString(
            "es-CO",
            data.length <= 9 ? { weekday: "short" } : { day: "numeric" },
          );

          return (
            <div
              key={d.fecha}
              className="group/bar relative flex h-full flex-1 flex-col justify-end"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              <div
                className="absolute bottom-4 left-0 right-0 rounded-t-[3px] bg-muted transition-opacity"
                style={{ height: `calc(${hEsperado}% - 1rem)` }}
              />
              <div
                className={cn(
                  "dash-bar relative z-10 mb-1 rounded-t-[3px] transition-all",
                  isToday
                    ? "bg-gradient-to-t from-primary to-violet-400 shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_45%,transparent)]"
                    : "bg-primary/50 group-hover/bar:bg-primary/80",
                  hovered === i && "ring-2 ring-primary/40",
                )}
                style={{ height: `calc(${hRecaudado}% - 1rem)` }}
              />
              <span
                className={cn(
                  "block truncate text-center text-[9px] font-bold tabular-nums",
                  isToday ? "text-primary" : "text-muted-foreground/60",
                  !showLabel && "opacity-0",
                )}
              >
                {dia}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ─────────────────────────── Cartera en riesgo ─────────────────────────── */

function CarteraRiesgoCard({
  cartera,
}: {
  cartera?: { mayorA3: number; mayorA7: number; mayorA15: number; montoTotal: number };
}) {
  if (!cartera) {
    return (
      <Card padding="md">
        <p className="py-10 text-center text-sm text-muted-foreground">Sin datos</p>
      </Card>
    );
  }

  const niveles = [
    { label: "Mora leve", detail: "3+ dias", monto: cartera.mayorA3, fill: "bg-danger/35" },
    { label: "Mora moderada", detail: "7+ dias", monto: cartera.mayorA7, fill: "bg-danger/65" },
    { label: "Mora severa", detail: "15+ dias", monto: cartera.mayorA15, fill: "bg-danger" },
  ];
  const maxMonto = Math.max(cartera.mayorA3, cartera.mayorA7, cartera.mayorA15, 1);

  return (
    <Card padding="md">
      <div className="space-y-4">
        {niveles.map((nivel) => {
          const width = (nivel.monto / maxMonto) * 100;
          return (
            <div key={nivel.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium text-foreground">
                  {nivel.label} <span className="text-muted-foreground">· {nivel.detail}</span>
                </span>
                <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                  {formatCop(nivel.monto)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("dash-fill h-full rounded-full", nivel.fill)}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-xs font-medium text-muted-foreground">Total en riesgo</span>
        <span className="font-display text-lg font-bold tabular-nums text-danger">
          {formatCop(cartera.montoTotal)}
        </span>
      </div>
    </Card>
  );
}

/* ─────────────────────────── Rendimiento por cobrador ─────────────────────────── */

function RendimientoLeaderboard({
  filas,
  nombreCobrador,
}: {
  filas: { cobrador_id: string; total: number }[];
  nombreCobrador: (id: string) => string;
}) {
  if (filas.length === 0) {
    return (
      <Card padding="md">
        <p className="py-6 text-center text-sm text-muted-foreground">Sin datos para el periodo</p>
      </Card>
    );
  }

  const max = Math.max(...filas.map((f) => f.total), 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm">
      {filas.map((fila, i) => {
        const rank = i + 1;
        const nombre = nombreCobrador(fila.cobrador_id);
        const width = (fila.total / max) * 100;
        return (
          <div
            key={`${fila.cobrador_id}-${i}`}
            className="dash-rise flex items-center gap-3.5 border-b border-border px-4 py-3.5 last:border-0"
            style={{ animationDelay: `${460 + i * 40}ms` }}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums",
                rank === 1
                  ? "bg-warning/20 text-warning"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {rank === 1 ? <Trophy className="h-3 w-3" /> : rank}
            </span>

            <Avatar initials={getInitials(nombre)} size="sm" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{nombre}</p>
                <p className="shrink-0 font-display text-sm font-bold tabular-nums text-foreground">
                  {formatCop(fila.total)}
                </p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "dash-fill h-full rounded-full",
                    rank === 1
                      ? "bg-gradient-to-r from-primary to-violet-400"
                      : "bg-primary/40",
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
