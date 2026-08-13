"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, RefreshCcw, Share2, XCircle } from "lucide-react";
import { postApi, ApiError } from "@/hooks/queries/fetch-api";
import { cancelarPrestamoSchema, diaCobroLabel, type CancelarPrestamoData, prestamoStep2Schema, type PrestamoStep2Data } from "@/lib/schemas/admin";
import { formatCop } from "@/lib/domain/money";
import { usePrestamo, type Prestamo } from "@/hooks/queries/use-prestamos";
import { useCronogramaPrestamo, type CuotaCronograma } from "@/hooks/queries/use-pagos";
import { useAuthMe } from "@/hooks/queries/use-auth-me";
import { EditPrestamoButton } from "@/components/domain/edit-prestamo-dialog";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { SkeletonList } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { SectionHead } from "@/components/ui/page-header";
import { buildPrestamoSummaryData } from "@/lib/domain/receipts";
import { ReceiptDialog } from "@/components/domain/receipt-dialog";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

const MODELO_OPTIONS = [
  { value: "cuota_fija", label: "Cuota fija" },
  { value: "solo_interes", label: "Solo interes" },
  { value: "sobre_saldo", label: "Sobre saldo" },
];

export default function PrestamoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: prestamo, isLoading, error } = usePrestamo(id);
  const { data: me } = useAuthMe();
  const { role } = useAuth();
  const { data: cuotas = [] } = useCronogramaPrestamo(id);
  const [receiptOpen, setReceiptOpen] = useState(false);

  if (isLoading) return <SkeletonList count={5} />;

  if (error || !prestamo) {
    return <ErrorState message={error?.message ?? "Prestamo no encontrado"} onRetry={() => router.back()} />;
  }

  const cuotasPagadas = prestamo.prestamo_saldos?.[0]?.cuotas_pagadas ?? 0;
  const cuotasTotales = prestamo.prestamo_saldos?.[0]?.cuotas_totales ?? 0;
  const saldoPendiente = prestamo.prestamo_saldos?.[0]?.saldo_pendiente ?? 0;

  const canRefinance =
    prestamo.estado === "activo" || prestamo.estado === "en_mora";
  const canCancel = prestamo.estado === "activo" || prestamo.estado === "en_mora";

  const progress = cuotasTotales > 0 ? Math.round((cuotasPagadas / cuotasTotales) * 100) : 0;

  const proximaCuotaReal = cuotas.find((c) => c.estado === "pendiente" || c.estado === "parcial");
  const proximaCuota = proximaCuotaReal
    ? { fecha: proximaCuotaReal.fecha_esperada, monto: proximaCuotaReal.monto_esperado - proximaCuotaReal.monto_pagado }
    : null;

  const receiptData = buildPrestamoSummaryData({
    negocio: me?.organization?.nombre_negocio ?? "CrediControl",
    cliente: prestamo.clientes?.nombre ?? "Cliente",
    capital: prestamo.capital,
    tasaMensual: prestamo.tasa_mensual,
    plazoDias: prestamo.plazo_dias,
    cuotasPagadas,
    cuotasTotales,
    saldoPendiente,
    estado: prestamo.estado,
    motivoCancelacion: prestamo.motivo_cancelacion,
    proximaCuota: prestamo.estado === "activo" || prestamo.estado === "en_mora" ? proximaCuota : null,
    diaCobroLabel:
      prestamo.dia_cobro && prestamo.dia_cobro.length > 0
        ? prestamo.dia_cobro.map(diaCobroLabel).join(", ")
        : null,
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="dash-rise group flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Volver
      </button>

      <div
        className="dash-rise flex flex-wrap items-end justify-between gap-3"
        style={{ animationDelay: "40ms" }}
      >
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Préstamo #{prestamo.id.slice(-4).toUpperCase()}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {prestamo.clientes?.nombre ?? "—"}
          </h1>
        </div>
        <LoanStatusBadge estado={prestamo.estado} />
      </div>

      {prestamo.estado === "cancelado" && (
        <Card
          padding="md"
          className="dash-rise flex items-start gap-3 border-danger/20 bg-danger/[0.04] p-4"
          style={{ animationDelay: "60ms" }}
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">
              Préstamo cancelado
              {prestamo.cancelado_at &&
                ` · ${new Date(prestamo.cancelado_at).toLocaleDateString("es-CO")}`}
            </p>
            <p className="mt-1 text-muted-foreground">
              {prestamo.motivo_cancelacion ?? "Sin motivo registrado."}
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-start">
        {/* Left: info + cronograma */}
        <div className="space-y-6">
          <Card
            padding="md"
            className="dash-rise p-5"
            style={{ animationDelay: "80ms" }}
          >
            {/* Cifras clave */}
            <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-primary/[0.04]">
              <div className="px-3 py-3 text-center sm:px-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Cuota diaria
                </p>
                <p className="mt-1 truncate font-display text-base font-bold tabular-nums text-primary sm:text-lg">
                  {formatCop(prestamo.cuota_diaria ?? 0)}
                </p>
              </div>
              <div className="px-3 py-3 text-center sm:px-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Total a pagar
                </p>
                <p className="mt-1 truncate font-display text-base font-bold tabular-nums text-foreground sm:text-lg">
                  {formatCop(prestamo.total_pagar ?? 0)}
                </p>
              </div>
              <div className="px-3 py-3 text-center sm:px-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Saldo pendiente
                </p>
                <p className="mt-1 truncate font-display text-base font-bold tabular-nums text-danger sm:text-lg">
                  {formatCop(saldoPendiente)}
                </p>
              </div>
            </div>

            {/* Condiciones */}
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Capital</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {formatCop(prestamo.capital)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Modelo</dt>
                <dd className="mt-0.5 font-medium capitalize text-foreground">
                  {prestamo.modelo_interes.replace("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tasa mensual</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {prestamo.tasa_mensual}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Plazo</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {prestamo.plazo_dias} días
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Inicio</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {prestamo.fecha_inicio ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Fin</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {prestamo.fecha_fin ?? "—"}
                </dd>
              </div>
              {prestamo.dia_cobro && prestamo.dia_cobro.length > 0 && (
                <div>
                  <dt className="text-xs text-muted-foreground">Día de cobro</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {prestamo.dia_cobro.map(diaCobroLabel).join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <div className="dash-rise" style={{ animationDelay: "160ms" }}>
            <CronogramaSection cuotas={cuotas} />
          </div>
        </div>

        {/* Right: stats + actions */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div
              className="dash-rise rounded-2xl border border-border bg-card p-4 backdrop-blur-sm"
              style={{ animationDelay: "120ms" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Cuotas pagadas
              </p>
              <p className="mt-1.5 font-display text-xl font-bold leading-none tabular-nums text-success">
                {cuotasPagadas}
                <span className="text-sm text-muted-foreground">/{cuotasTotales}</span>
              </p>
            </div>
            <div
              className="dash-rise rounded-2xl border border-border bg-card p-4 backdrop-blur-sm"
              style={{ animationDelay: "180ms" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Progreso
              </p>
              <p className="mt-1.5 font-display text-xl font-bold leading-none tabular-nums text-foreground">
                {progress}%
              </p>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="dash-fill h-full rounded-full bg-gradient-to-r from-primary to-violet-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div
            className="dash-rise flex flex-wrap gap-3 lg:flex-col"
            style={{ animationDelay: "240ms" }}
          >
            <Button variant="outline" onClick={() => setReceiptOpen(true)} className="gap-1.5">
              <Share2 className="h-4 w-4" />
              Compartir resumen
            </Button>
            {canRefinance && <EditPrestamoButton prestamo={prestamo} />}
            {canRefinance && role !== "cobrador" && <RefinanciarButton prestamo={prestamo} />}
            {canCancel && role !== "cobrador" && <CancelarButton prestamoId={prestamo.id} />}
          </div>
        </div>
      </div>

      <ReceiptDialog
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        data={receiptData}
        filename={`resumen-prestamo-${id.slice(-6)}.png`}
      />
    </div>
  );
}

const CUOTA_ESTADO_STYLES: Record<CuotaCronograma["estado"], string> = {
  pagado: "bg-success/15 text-success",
  parcial: "bg-info/15 text-info",
  pendiente: "bg-muted text-muted-foreground",
  vencido: "bg-danger/15 text-danger",
  cancelado: "bg-muted text-muted-foreground line-through",
};

function CronogramaSection({ cuotas }: { cuotas: CuotaCronograma[] }) {
  const [showAll, setShowAll] = useState(false);

  if (cuotas.length === 0) {
    return (
      <div>
        <SectionHead title="Cronograma de pagos" count={0} />
        <div className="rounded-2xl border border-border bg-card p-4 text-center text-xs text-muted-foreground backdrop-blur-sm">
          Este préstamo no tiene fecha de inicio definida, así que aún no hay cronograma.
        </div>
      </div>
    );
  }

  const displayCuotas = showAll ? cuotas : cuotas.slice(0, 7);

  return (
    <div>
      <SectionHead title="Cronograma de pagos" count={cuotas.length} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2.5 pl-4 pr-2 text-left text-[10px] font-bold uppercase tracking-[0.14em]">#</th>
                <th className="py-2.5 pr-2 text-left text-[10px] font-bold uppercase tracking-[0.14em]">Fecha</th>
                <th className="py-2.5 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.14em]">Cuota</th>
                <th className="py-2.5 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.14em]">Capital</th>
                <th className="py-2.5 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.14em]">Interés</th>
                <th className="py-2.5 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.14em]">Saldo</th>
                <th className="py-2.5 pr-4 text-right text-[10px] font-bold uppercase tracking-[0.14em]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {displayCuotas.map((cuota) => (
                <tr
                  key={cuota.id}
                  className={`border-b border-border/50 transition-colors last:border-0 ${cuota.estado === "pagado" ? "bg-success/[0.06]" : "hover:bg-primary/[0.03]"}`}
                >
                  <td className="py-2.5 pl-4 pr-2">
                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${CUOTA_ESTADO_STYLES[cuota.estado]}`}
                    >
                      {cuota.numero_cuota}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">
                    {cuota.fecha_esperada}
                  </td>
                  <td className="py-2.5 pr-2 text-right font-semibold tabular-nums text-foreground">
                    {formatCop(cuota.monto_esperado)}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-muted-foreground">
                    {formatCop(cuota.monto_capital ?? 0)}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-muted-foreground">
                    {formatCop(cuota.monto_interes ?? 0)}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-muted-foreground">
                    {formatCop(cuota.saldo_estimado ?? 0)}
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${CUOTA_ESTADO_STYLES[cuota.estado]}`}
                    >
                      {cuota.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cuotas.length > 7 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full border-t border-border py-2.5 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/[0.05]"
          >
            {showAll ? "Ver menos" : `Ver todas las ${cuotas.length} cuotas`}
          </button>
        )}
      </div>
    </div>
  );
}

function RefinanciarButton({ prestamo }: { prestamo: Prestamo }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PrestamoStep2Data>({
    resolver: zodResolver(prestamoStep2Schema),
    defaultValues: {
      capital: prestamo.capital,
      modeloInteres: prestamo.modelo_interes,
      tasaMensual: prestamo.tasa_mensual,
      plazoDias: prestamo.plazo_dias,
      fechaInicio: new Date().toISOString().slice(0, 10),
      excluirSabados: prestamo.excluir_sabados,
      excluirDomingos: prestamo.excluir_domingos,
    },
  });

  const modeloInteres = useWatch({ control, name: "modeloInteres" });

  async function onSubmit(data: PrestamoStep2Data) {
    setSaving(true);
    try {
      const res = await fetch(`/api/prestamos/${prestamo.id}/refinanciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capital: data.capital,
          modeloInteres: data.modeloInteres,
          tasaMensual: data.tasaMensual,
          plazoDias: data.plazoDias,
          fechaInicio: data.fechaInicio,
          excluirSabados: data.excluirSabados,
          excluirDomingos: data.excluirDomingos,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string }; message?: string }).error?.message ??
            (body as { message?: string }).message ??
            "No se pudo refinanciar el préstamo",
        );
      }
      const created = (await res.json()) as { data?: { id?: string } };
      toast.success("Préstamo refinanciado correctamente");
      await queryClient.invalidateQueries({ queryKey: ["prestamos"] });
      setOpen(false);
      if (created.data?.id) router.push(`/app/prestamos/${created.data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo refinanciar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="flex-1">
        <RefreshCcw className="mr-2 h-4 w-4" />
        Refinanciar
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Refinanciar préstamo"
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" form="refinanciar-form" loading={saving} className="flex-1">
              Refinanciar
            </Button>
          </div>
        }
      >
        <form id="refinanciar-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            Se creará un préstamo nuevo con estas condiciones. El actual pasará a
            estado &ldquo;Refinanciado&rdquo;.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Capital" type="number" error={errors.capital?.message} {...register("capital", { valueAsNumber: true })} />
            <Select
              label="Modelo de interés"
              options={MODELO_OPTIONS}
              placeholder="Selecciona un modelo"
              error={errors.modeloInteres?.message}
              value={modeloInteres ?? ""}
              {...register("modeloInteres")}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Tasa mensual (%)" type="number" step="0.1" error={errors.tasaMensual?.message} {...register("tasaMensual", { valueAsNumber: true })} />
            <Input label="Plazo (días)" type="number" error={errors.plazoDias?.message} {...register("plazoDias", { valueAsNumber: true })} />
          </div>
          <Input label="Fecha de inicio" type="date" error={errors.fechaInicio?.message} {...register("fechaInicio")} />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("excluirSabados")} className="h-4 w-4 rounded border-border" />
              Excluir sábados
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("excluirDomingos")} className="h-4 w-4 rounded border-border" />
              Excluir domingos
            </label>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function CancelarButton({ prestamoId }: { prestamoId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CancelarPrestamoData>({
    resolver: zodResolver(cancelarPrestamoSchema),
  });

  async function onSubmit(data: CancelarPrestamoData) {
    try {
      await postApi(`/api/prestamos/${prestamoId}/cancelar`, data);
      await queryClient.invalidateQueries({ queryKey: ["prestamos", prestamoId] });
      await queryClient.invalidateQueries({ queryKey: ["prestamos"] });
      toast.success("Prestamo cancelado");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo cancelar el prestamo");
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex-1 text-danger hover:bg-danger/10"
      >
        <XCircle className="mr-2 h-4 w-4" />
        Cancelar
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Cancelar prestamo"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-danger font-medium">
            Esta accion no se puede deshacer.
          </p>
          <Input
            label="Motivo de cancelacion"
            placeholder="Describe el motivo..."
            error={errors.motivo?.message}
            {...register("motivo")}
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              No cancelar
            </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1 bg-danger text-white hover:bg-danger/90"
          >
            Cancelar prestamo
          </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
