"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { editarPrestamoSchema, type EditarPrestamoData } from "@/lib/schemas/admin";
import { buildLoanSchedule, calculateLoanTotals, type LoanModel } from "@/lib/domain/loans";
import { formatCop } from "@/lib/domain/money";
import { useClientes } from "@/hooks/queries/use-clientes";
import { useCobradores } from "@/hooks/queries/use-cobradores";
import type { Prestamo } from "@/hooks/queries/use-prestamos";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

const MODELO_OPTIONS = [
  { value: "cuota_fija", label: "Cuota fija" },
  { value: "solo_interes", label: "Solo interes" },
  { value: "sobre_saldo", label: "Sobre saldo" },
] as const;

type EditPrestamoDialogProps = {
  prestamo: Prestamo;
  disabled?: boolean;
};

export function EditPrestamoButton({ prestamo, disabled = false }: EditPrestamoDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex-1"
        disabled={disabled}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Editar
      </Button>

      <EditPrestamoDialog prestamo={prestamo} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function EditPrestamoDialog({
  prestamo,
  open,
  onClose,
}: {
  prestamo: Prestamo;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: clientes = [] } = useClientes({ activo: true, pageSize: 300 });
  const { data: cobradores = [] } = useCobradores({ activo: true });
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditarPrestamoData>({
    resolver: zodResolver(editarPrestamoSchema),
    defaultValues: {
      clienteId: prestamo.cliente_id,
      capital: prestamo.capital,
      modeloInteres: prestamo.modelo_interes as LoanModel,
      tasaMensual: prestamo.tasa_mensual,
      plazoDias: prestamo.plazo_dias,
      fechaInicio: prestamo.fecha_inicio ?? "",
      excluirSabados: prestamo.excluir_sabados,
      excluirDomingos: prestamo.excluir_domingos,
      cobradorId: prestamo.cobrador_id ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      clienteId: prestamo.cliente_id,
      capital: prestamo.capital,
      modeloInteres: prestamo.modelo_interes as LoanModel,
      tasaMensual: prestamo.tasa_mensual,
      plazoDias: prestamo.plazo_dias,
      fechaInicio: prestamo.fecha_inicio ?? "",
      excluirSabados: prestamo.excluir_sabados,
      excluirDomingos: prestamo.excluir_domingos,
      cobradorId: prestamo.cobrador_id ?? "",
    });
  }, [open, prestamo, reset]);

  const [clienteId, capital, modeloInteres, tasaMensual, plazoDias, fechaInicio, excluirSabados, excluirDomingos, cobradorId] = useWatch({
    control,
    name: [
      "clienteId",
      "capital",
      "modeloInteres",
      "tasaMensual",
      "plazoDias",
      "fechaInicio",
      "excluirSabados",
      "excluirDomingos",
      "cobradorId",
    ],
  });

  const preview = useMemo(() => {
    const c = Number(capital);
    const t = Number(tasaMensual);
    const p = Number(plazoDias);
    if (!c || !t || !p || !modeloInteres || !fechaInicio) return null;
    try {
      const totals = calculateLoanTotals({
        capital: c,
        modelo: modeloInteres as LoanModel,
        plazoDias: p,
        tasaMensual: t,
      });
      const schedule = buildLoanSchedule({
        capital: c,
        excluirDomingos: Boolean(excluirDomingos),
        excluirSabados: Boolean(excluirSabados),
        fechaInicio,
        modelo: modeloInteres as LoanModel,
        plazoDias: p,
        tasaMensual: t,
      });
      return { ...totals, cuotas: schedule.length, fin: schedule.at(-1)?.fechaEsperada ?? fechaInicio };
    } catch {
      return null;
    }
  }, [capital, modeloInteres, tasaMensual, plazoDias, fechaInicio, excluirSabados, excluirDomingos]);

  const cuotasPagadas = prestamo.prestamo_saldos?.[0]?.cuotas_pagadas ?? 0;
  const hasPayments = cuotasPagadas > 0;

  async function onSubmit(data: EditarPrestamoData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/prestamos/${prestamo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          cobradorId: data.cobradorId || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          (body as { error?: { message?: string }; message?: string }).error?.message ??
          (body as { message?: string }).message ??
          "No se pudo editar el prestamo";
        throw new Error(message);
      }
      toast.success("Prestamo actualizado correctamente");
      await queryClient.invalidateQueries({ queryKey: ["prestamos", prestamo.id] });
      await queryClient.invalidateQueries({ queryKey: ["prestamos"] });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo editar el prestamo");
    } finally {
      setSaving(false);
    }
  }

  const clienteOptions = clientes.map((cliente) => ({
    value: cliente.id,
    label: `${cliente.nombre}${cliente.cedula ? ` · ${cliente.cedula}` : ""}`,
  }));

  const cobradorOptions = [
    { value: "", label: "Sin cobrador asignado" },
    ...cobradores.map((cobrador) => ({
      value: cobrador.id,
      label: cobrador.nombre_completo,
    })),
  ];

  return (
    <Dialog open={open} onClose={onClose} title="Editar préstamo">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {hasPayments && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
            Ya existen pagos registrados. Solo puedes cambiar cliente o cobrador; los campos financieros quedan bloqueados.
          </p>
        )}

        <Select
          label="Cliente"
          options={clienteOptions}
          placeholder="Buscar cliente..."
          error={errors.clienteId?.message}
          searchable
          value={clienteId ?? ""}
          {...register("clienteId")}
        />

        <Input
          label="Capital"
          type="number"
          placeholder="1.500.000"
          error={errors.capital?.message}
          disabled={hasPayments}
          {...register("capital", { valueAsNumber: true })}
        />

        <Select
          label="Modelo de interes"
          options={[...MODELO_OPTIONS]}
          placeholder="Selecciona un modelo"
          error={errors.modeloInteres?.message}
          value={modeloInteres ?? ""}
          disabled={hasPayments}
          {...register("modeloInteres")}
        />

        <Input
          label="Tasa mensual (%)"
          type="number"
          step="0.1"
          placeholder="10"
          error={errors.tasaMensual?.message}
          disabled={hasPayments}
          {...register("tasaMensual", { valueAsNumber: true })}
        />

        <Input
          label="Plazo (dias)"
          type="number"
          placeholder="30"
          error={errors.plazoDias?.message}
          disabled={hasPayments}
          {...register("plazoDias", { valueAsNumber: true })}
        />

        <Input
          label="Fecha de inicio"
          type="date"
          error={errors.fechaInicio?.message}
          disabled={hasPayments}
          {...register("fechaInicio")}
        />

        <Select
          label="Cobrador"
          options={cobradorOptions}
          error={errors.cobradorId?.message}
          searchable
          value={cobradorId ?? ""}
          {...register("cobradorId")}
        />

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("excluirSabados")} className="h-4 w-4 rounded border-border" disabled={hasPayments} />
            Excluir sabados
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("excluirDomingos")} className="h-4 w-4 rounded border-border" disabled={hasPayments} />
            Excluir domingos
          </label>
        </div>

        {!hasPayments && preview && (
          <Card padding="md" className="border-primary/25 bg-primary/[0.06]">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Vista previa
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cuota diaria</p>
                <p className="mt-1 font-display text-lg font-bold tabular-nums text-primary">
                  {formatCop(preview.cuotaDiaria)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total a pagar</p>
                <p className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">
                  {formatCop(preview.totalPagar)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cuotas</p>
                <p className="mt-1 font-medium text-foreground">{preview.cuotas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fin estimado</p>
                <p className="mt-1 font-medium tabular-nums text-foreground">{preview.fin}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            Guardar cambios
          </Button>
        </div>
      </form>
    </Dialog>
  );
}