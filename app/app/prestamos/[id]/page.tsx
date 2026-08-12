"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, RefreshCcw, XCircle } from "lucide-react";
import { postApi, ApiError } from "@/hooks/queries/fetch-api";
import { cancelarPrestamoSchema, type CancelarPrestamoData } from "@/lib/schemas/admin";
import { buildLoanSchedule, type LoanModel } from "@/lib/domain/loans";
import { formatCop } from "@/lib/domain/money";
import { usePrestamo, type Prestamo } from "@/hooks/queries/use-prestamos";
import { EditPrestamoButton } from "@/components/domain/edit-prestamo-dialog";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { SkeletonList } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { SectionHead } from "@/components/ui/page-header";
import { toast } from "sonner";

export default function PrestamoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: prestamo, isLoading, error } = usePrestamo(id);

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
  const canEdit = canRefinance && cuotasPagadas === 0;

  const progress = cuotasTotales > 0 ? Math.round((cuotasPagadas / cuotasTotales) * 100) : 0;

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
            </dl>
          </Card>

          <div className="dash-rise" style={{ animationDelay: "160ms" }}>
            <CronogramaSection prestamo={prestamo} cuotasPagadas={cuotasPagadas} />
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

          {(canRefinance || canCancel) && (
            <div
              className="dash-rise flex gap-3 lg:flex-col"
              style={{ animationDelay: "240ms" }}
            >
              {canEdit && <EditPrestamoButton prestamo={prestamo} />}
              {canRefinance && <RefinanciarButton prestamoId={prestamo.id} />}
              {canCancel && <CancelarButton prestamoId={prestamo.id} />}
            </div>
          )}
          {!canEdit && canRefinance && cuotasPagadas > 0 && (
            <p className="text-xs text-muted-foreground">
              La edición completa solo está disponible antes del primer pago.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CronogramaSection({
  prestamo,
  cuotasPagadas,
}: {
  prestamo: Prestamo;
  cuotasPagadas: number;
}) {
  const [showAll, setShowAll] = useState(false);

  if (!prestamo.fecha_inicio) {
    return (
      <div>
        <SectionHead title="Cronograma de pagos" count={0} />
        <div className="rounded-2xl border border-border bg-card p-4 text-center text-xs text-muted-foreground backdrop-blur-sm">
          Este préstamo no tiene fecha de inicio definida, así que aún no hay cronograma.
        </div>
      </div>
    );
  }

  const schedule = buildLoanSchedule({
    capital: prestamo.capital,
    excluirDomingos: prestamo.excluir_domingos,
    excluirSabados: prestamo.excluir_sabados,
    fechaInicio: prestamo.fecha_inicio,
    modelo: prestamo.modelo_interes as LoanModel,
    plazoDias: prestamo.plazo_dias,
    tasaMensual: prestamo.tasa_mensual,
  });

  const displaySchedule = showAll ? schedule : schedule.slice(0, 7);

  return (
    <div>
      <SectionHead title="Cronograma de pagos" count={schedule.length} />

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
                <th className="py-2.5 pr-4 text-right text-[10px] font-bold uppercase tracking-[0.14em]">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {displaySchedule.map((cuota) => {
                const isPaid = cuota.numeroCuota <= cuotasPagadas;
                return (
                  <tr
                    key={cuota.numeroCuota}
                    className={`border-b border-border/50 transition-colors last:border-0 ${isPaid ? "bg-success/[0.06]" : "hover:bg-primary/[0.03]"}`}
                  >
                    <td className="py-2.5 pl-4 pr-2">
                      <span
                        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
                          isPaid
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {cuota.numeroCuota}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">
                      {cuota.fechaEsperada}
                    </td>
                    <td className="py-2.5 pr-2 text-right font-semibold tabular-nums text-foreground">
                      {formatCop(cuota.montoEsperado)}
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums text-muted-foreground">
                      {formatCop(cuota.montoCapital)}
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums text-muted-foreground">
                      {formatCop(cuota.montoInteres)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                      {formatCop(cuota.saldoEstimado)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {schedule.length > 7 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full border-t border-border py-2.5 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/[0.05]"
          >
            {showAll ? "Ver menos" : `Ver todas las ${schedule.length} cuotas`}
          </button>
        )}
      </div>
    </div>
  );
}

function RefinanciarButton({ }: { prestamoId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex-1"
      >
        <RefreshCcw className="mr-2 h-4 w-4" />
        Refinanciar
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Refinanciar prestamo"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se creara un nuevo prestamo con las nuevas condiciones. El prestamo
            actual cambiara a estado &ldquo;Refinanciado&rdquo;.
          </p>
          <p className="text-sm text-muted-foreground">
            Configura las nuevas condiciones en el wizard de nuevo prestamo.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                // TODO: Reemplazar por navegación a wizard con datos del prestamo actual
                setOpen(false);
                toast.info("Refinanciamiento — pendiente de integracion con API");
              }}
              className="flex-1"
            >
              Continuar
            </Button>
          </div>
        </div>
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
