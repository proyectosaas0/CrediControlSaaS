"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Phone,
  DollarSign,
  ShieldCheck,
  Send,
  AlertOctagon,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useMoraList, type MoraRegistro } from "@/hooks/queries/use-mora";
import { formatCop } from "@/lib/domain/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { SkeletonGrid, SkeletonList } from "@/components/ui/skeleton";
import {
  PageHeader,
  FilterPills,
  SearchInput,
  staggerDelay,
} from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/components/ui/cn";
import { toast } from "sonner";

type FiltroEstado = "todos" | "activa" | "pagada" | "condonada";
type FiltroDias = "todos" | "leve" | "moderada" | "severa";

function getDiasFiltro(dias: number): FiltroDias {
  if (dias <= 10) return "leve";
  if (dias <= 20) return "moderada";
  return "severa";
}

export default function MoraPage() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [filtroDias, setFiltroDias] = useState<FiltroDias>("todos");

  const { data: moraData = [], isLoading, error, refetch } = useMoraList();

  const filtered = useMemo(() => {
    let list = moraData;

    if (filtroEstado !== "todos") list = list.filter((m) => m.estado === filtroEstado);
    if (filtroDias !== "todos") list = list.filter((m) => getDiasFiltro(m.dias_mora ?? 0) === filtroDias);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.prestamos.clientes.nombre.toLowerCase().includes(q),
      );
    }

    return list.sort((a, b) => (b.dias_mora ?? 0) - (a.dias_mora ?? 0));
  }, [search, filtroEstado, filtroDias, moraData]);

  const resumen = useMemo(() => {
    const activas = moraData.filter((m) => m.estado === "activa");
    const totalMonto = activas.reduce((sum, m) => sum + ((m.monto_mora ?? 0) - m.monto_pagado_mora), 0);
    const avgDias = activas.length > 0
      ? Math.round(activas.reduce((sum, m) => sum + (m.dias_mora ?? 0), 0) / activas.length)
      : 0;
    return { clientesEnMora: activas.length, montoTotalMora: totalMonto, promedioDias: avgDias };
  }, [moraData]);

  const estados: { value: FiltroEstado; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "activa", label: "Activa" },
    { value: "pagada", label: "Pagada" },
    { value: "condonada", label: "Condonada" },
  ];

  const diasFiltros: { value: FiltroDias; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "leve", label: "1-10 dias" },
    { value: "moderada", label: "11-20 dias" },
    { value: "severa", label: "21+ dias" },
  ];

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Riesgo"
        title="Panel de mora"
        subtitle={
          isLoading
            ? "Cargando cartera en riesgo…"
            : resumen.clientesEnMora === 0
              ? "Cartera sana: sin moras activas."
              : `${resumen.clientesEnMora} cliente${resumen.clientesEnMora !== 1 ? "s" : ""} con mora activa`
        }
      />

      {isLoading ? (
        <SkeletonGrid count={3} cols={3} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MoraStat
            icon={AlertTriangle}
            label="Clientes en mora"
            value={resumen.clientesEnMora}
            tone={resumen.clientesEnMora > 0 ? "danger" : "muted"}
            delay={60}
          />
          <MoraStat
            icon={DollarSign}
            label="Monto total"
            value={formatCop(resumen.montoTotalMora)}
            tone={resumen.montoTotalMora > 0 ? "danger" : "muted"}
            delay={120}
          />
          <MoraStat
            icon={Clock}
            label="Promedio días"
            value={resumen.promedioDias}
            tone={resumen.promedioDias > 0 ? "warning" : "muted"}
            delay={180}
          />
        </div>
      )}

      <div
        className="dash-rise flex flex-col gap-3"
        style={{ animationDelay: "240ms" }}
      >
        <SearchInput
          placeholder="Buscar por cliente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterPills options={estados} value={filtroEstado} onChange={setFiltroEstado} />
          <span className="hidden h-4 w-px bg-border sm:block" />
          <FilterPills options={diasFiltros} value={filtroDias} onChange={setFiltroDias} />
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={AlertOctagon}
          title={search || filtroEstado !== "todos" || filtroDias !== "todos" ? "Sin resultados" : "Sin clientes en mora"}
          description={search || filtroEstado !== "todos" || filtroDias !== "todos" ? "Intenta con otros filtros." : "Todos los clientes están al día."}
        />
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {filtered.map((mora, i) => (
            <MoraCard key={mora.id} mora={mora} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function MoraStat({
  icon: Icon,
  label,
  value,
  tone,
  delay,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: string | number;
  tone: "danger" | "warning" | "muted";
  delay: number;
}) {
  const toneStyles = {
    danger: "bg-danger/15 text-danger",
    warning: "bg-warning/15 text-warning",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div
      className="dash-rise flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 backdrop-blur-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          toneStyles[tone],
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 truncate font-display text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

function MoraCard({ mora, index }: { mora: MoraRegistro; index: number }) {
  const diasMora = mora.dias_mora ?? 0;
  const montoPendiente = (mora.monto_mora ?? 0) - mora.monto_pagado_mora;

  const severity =
    diasMora <= 10
      ? { border: "border-l-warning", chip: "bg-warning/15 text-warning" }
      : diasMora <= 20
        ? { border: "border-l-orange-500", chip: "bg-orange-500/15 text-orange-400" }
        : { border: "border-l-danger", chip: "bg-danger/15 text-danger" };

  return (
    <Card
      padding="md"
      className={cn("dash-rise border-l-4", severity.border)}
      style={staggerDelay(index)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {mora.prestamos.clientes.nombre}
          </p>
          {mora.prestamos.clientes.telefono && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {mora.prestamos.clientes.telefono}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-lg font-bold leading-none tabular-nums text-danger">
            {formatCop(montoPendiente)}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Pendiente
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-semibold tabular-nums",
            mora.estado === "activa"
              ? severity.chip
              : mora.estado === "pagada"
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground",
          )}
        >
          {diasMora} día{diasMora !== 1 ? "s" : ""} en mora
        </span>
        <span className="tabular-nums">
          Cuota {formatCop(mora.prestamos.cuota_diaria ?? 0)}
        </span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">
          Capital {formatCop(mora.prestamos.capital)}
        </span>
      </div>

      {mora.estado === "activa" && (
        <div className="mt-3.5 flex gap-2 border-t border-dashed border-border pt-3">
          <PagarMoraButton mora={mora} />
          <CondonarMoraButton mora={mora} />
          <WhatsAppButton
            telefono={mora.prestamos.clientes.telefono ?? ""}
            cliente={mora.prestamos.clientes.nombre}
          />
        </div>
      )}
    </Card>
  );
}

const pagarMoraSchema = z.object({
  monto: z.number().positive("El monto debe ser mayor a 0"),
});

function PagarMoraButton({ mora }: { mora: MoraRegistro }) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ monto: number }>({
    resolver: zodResolver(pagarMoraSchema),
    defaultValues: { monto: (mora.monto_mora ?? 0) - mora.monto_pagado_mora },
  });

  function onSubmit() {
    toast.success("Pago de mora registrado");
    setOpen(false);
  }

  return (
    <>
      <Button size="sm" variant="success" onClick={() => setOpen(true)} className="flex-1 h-9">
        <DollarSign className="h-4 w-4" />
        Pagar
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Registrar pago de mora">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Monto a pagar"
            type="number"
            error={errors.monto?.message}
            {...register("monto", { valueAsNumber: true })}
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Registrar pago
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

const condonarSchema = z.object({
  motivo: z.string().trim().min(3, "El motivo debe tener al menos 3 caracteres"),
});

function CondonarMoraButton({ mora }: { mora: MoraRegistro }) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ motivo: string }>({
    resolver: zodResolver(condonarSchema),
  });

  function onSubmit() {
    // TODO: Reemplazar por POST /api/mora/[id]/condonar
    console.log("Condonar mora:", mora.id);
    toast.success("Mora condonada correctamente");
    setOpen(false);
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="flex-1 h-9">
        <ShieldCheck className="h-4 w-4" />
        Condonar
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Condonar mora">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La mora sera marcada como condonada. El cliente no debera este monto.
          </p>
          <Input
            label="Motivo de condonacion"
            placeholder="Describe el motivo..."
            error={errors.motivo?.message}
            {...register("motivo")}
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Condonar
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function WhatsAppButton({ telefono, cliente }: { telefono: string; cliente: string }) {
  const mensaje = `Hola ${cliente}, tienes un saldo pendiente en mora. Por favor comunícate para regularizar tu situación.`;
  const url = `https://wa.me/${telefono.replace("+", "")}?text=${encodeURIComponent(mensaje)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-medium text-white hover:bg-[#22c35e] transition-colors"
    >
      <Send className="h-4 w-4" />
      WhatsApp
    </a>
  );
}
