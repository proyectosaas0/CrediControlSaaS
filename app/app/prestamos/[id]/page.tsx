"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, RefreshCcw, XCircle } from "lucide-react";
import { cancelarPrestamoSchema, type CancelarPrestamoData } from "@/lib/schemas/admin";
import { buildLoanSchedule, type LoanModel } from "@/lib/domain/loans";
import { formatCop } from "@/lib/domain/money";
import { usePrestamo, type Prestamo } from "@/hooks/queries/use-prestamos";
import { LoanStatusBadge } from "@/components/domain/loan-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { SkeletonList } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
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

  const cuotasPagadas = prestamo.prestamo_saldos[0]?.cuotas_pagadas ?? 0;
  const cuotasTotales = prestamo.prestamo_saldos[0]?.cuotas_totales ?? 0;
  const saldoPendiente = prestamo.prestamo_saldos[0]?.saldo_pendiente ?? 0;

  const canRefinance =
    prestamo.estado === "activo" || prestamo.estado === "en_mora";
  const canCancel = prestamo.estado === "activo" || prestamo.estado === "en_mora";

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          Prestamo {prestamo.id.slice(-4).toUpperCase()}
        </h1>
        <LoanStatusBadge estado={prestamo.estado} />
      </div>

      <Card padding="md">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium text-foreground">
              {prestamo.clientes?.nombre ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Capital</span>
            <span className="font-mono text-foreground">
              {formatCop(prestamo.capital)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modelo</span>
            <span className="text-foreground">
              {prestamo.modelo_interes.replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tasa mensual</span>
            <span className="text-foreground">{prestamo.tasa_mensual}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plazo</span>
            <span className="text-foreground">{prestamo.plazo_dias} dias</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inicio</span>
            <span className="text-foreground">{prestamo.fecha_inicio ?? ""}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fin</span>
            <span className="text-foreground">{prestamo.fecha_fin ?? ""}</span>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cuota diaria</span>
            <span className="font-bold font-mono text-primary">
              {formatCop(prestamo.cuota_diaria ?? 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total a pagar</span>
            <span className="font-bold font-mono text-foreground">
              {formatCop(prestamo.total_pagar ?? 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Saldo pendiente</span>
            <span className="font-bold font-mono text-danger">
              {formatCop(saldoPendiente)}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Cuotas pagadas</p>
          <p className="text-lg font-bold text-success">
            {cuotasPagadas}/{cuotasTotales}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">Progreso</p>
          <p className="text-lg font-bold text-foreground">
            {cuotasTotales > 0 ? Math.round((cuotasPagadas / cuotasTotales) * 100) : 0}%
          </p>
          <div className="mt-1 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: `${cuotasTotales > 0 ? Math.round((cuotasPagadas / cuotasTotales) * 100) : 0}%`,
              }}
            />
          </div>
        </Card>
      </div>

      <CronogramaSection prestamo={prestamo} cuotasPagadas={cuotasPagadas} />

      {(canRefinance || canCancel) && (
        <div className="flex gap-3 pt-2">
          {canRefinance && <RefinanciarButton prestamoId={prestamo.id} />}
          {canCancel && <CancelarButton prestamoId={prestamo.id} />}
        </div>
      )}
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

  const schedule = buildLoanSchedule({
    capital: prestamo.capital,
    excluirDomingos: false,
    excluirSabados: false,
    fechaInicio: prestamo.fecha_inicio ?? "",
    modelo: prestamo.modelo_interes as LoanModel,
    plazoDias: prestamo.plazo_dias,
    tasaMensual: prestamo.tasa_mensual,
  });

  const displaySchedule = showAll ? schedule : schedule.slice(0, 7);

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Cronograma de pagos
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="pb-2 pr-2 text-left font-medium">#</th>
              <th className="pb-2 pr-2 text-left font-medium">Fecha</th>
              <th className="pb-2 pr-2 text-right font-medium">Cuota</th>
              <th className="pb-2 pr-2 text-right font-medium">Capital</th>
              <th className="pb-2 pr-2 text-right font-medium">Interes</th>
              <th className="pb-2 text-right font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {displaySchedule.map((cuota) => {
              const isPaid = cuota.numeroCuota <= cuotasPagadas;
              return (
                <tr
                  key={cuota.numeroCuota}
                  className={`border-b border-border/50 ${isPaid ? "bg-success/5" : ""}`}
                >
                  <td className="py-2 pr-2 text-foreground">
                    {cuota.numeroCuota}
                  </td>
                  <td className="py-2 pr-2 text-muted-foreground">
                    {cuota.fechaEsperada}
                  </td>
                  <td className="py-2 pr-2 text-right font-mono text-foreground">
                    {formatCop(cuota.montoEsperado)}
                  </td>
                  <td className="py-2 pr-2 text-right font-mono text-muted-foreground">
                    {formatCop(cuota.montoCapital)}
                  </td>
                  <td className="py-2 pr-2 text-right font-mono text-muted-foreground">
                    {formatCop(cuota.montoInteres)}
                  </td>
                  <td className="py-2 text-right font-mono text-muted-foreground">
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
          className="mt-2 text-xs text-primary hover:underline"
        >
          {showAll
            ? "Ver menos"
            : `Ver todas las ${schedule.length} cuotas`}
        </button>
      )}
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CancelarPrestamoData>({
    resolver: zodResolver(cancelarPrestamoSchema),
  });

  async function onSubmit(data: CancelarPrestamoData) {
    // TODO: Reemplazar por POST /api/prestamos/[id]/cancelar
    console.log("Cancelar prestamo:", prestamoId, data);
    toast.success("Prestamo cancelado");
    setOpen(false);
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
