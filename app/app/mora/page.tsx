"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Phone, DollarSign, ShieldCheck, Send, AlertOctagon } from "lucide-react";
import { useMoraList, type MoraRegistro } from "@/hooks/queries/use-mora";
import { formatCop } from "@/lib/domain/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { SkeletonGrid, SkeletonList } from "@/components/ui/skeleton";
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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Panel de Mora</h1>

      {isLoading ? (
        <SkeletonGrid count={3} cols={3} />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Card padding="md">
            <p className="text-xs text-muted-foreground">Clientes en mora</p>
            <p className="text-lg font-bold text-danger">{resumen.clientesEnMora}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-muted-foreground">Monto total</p>
            <p className="text-lg font-bold font-mono text-danger">
              {formatCop(resumen.montoTotalMora)}
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-muted-foreground">Promedio dias</p>
            <p className="text-lg font-bold text-warning">{resumen.promedioDias}</p>
          </Card>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {estados.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroEstado(f.value)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filtroEstado === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {diasFiltros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroDias(f.value)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filtroDias === f.value
                ? "bg-warning text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {f.label}
          </button>
        ))}
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
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((mora) => (
            <MoraCard key={mora.id} mora={mora} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function MoraCard({ mora }: { mora: MoraRegistro }) {
  const diasMora = mora.dias_mora ?? 0;

  const severityColor =
    diasMora <= 10
      ? "border-l-warning"
      : diasMora <= 20
        ? "border-l-orange-500"
        : "border-l-danger";

  return (
    <Card padding="md" className={cn("border-l-4", severityColor)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {mora.prestamos.clientes.nombre}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {mora.prestamos.clientes.telefono ?? ""}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                mora.estado === "activa"
                  ? "bg-danger/15 text-danger"
                  : mora.estado === "pagada"
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {diasMora} dias en mora
            </span>
            <span className="text-xs font-mono font-semibold text-danger">
              {formatCop((mora.monto_mora ?? 0) - mora.monto_pagado_mora)}
            </span>
          </div>

          <div className="mt-2 flex gap-1 text-xs text-muted-foreground">
            <span>Cuota: {formatCop(mora.prestamos.cuota_diaria ?? 0)}</span>
            <span>·</span>
            <span>Capital: {formatCop(mora.prestamos.capital)}</span>
          </div>
        </div>
      </div>

      {mora.estado === "activa" && (
        <div className="mt-3 flex gap-2">
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
