"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  prestamoStep1Schema,
  prestamoStep2Schema,
  type PrestamoStep1Data,
  type PrestamoStep2Data,
} from "@/lib/schemas/admin";
import { calculateLoanTotals, type LoanModel } from "@/lib/domain/loans";
import { formatCop } from "@/lib/domain/money";
import { useClientes } from "@/hooks/queries/use-clientes";
import { useCobradores, type Cobrador } from "@/hooks/queries/use-cobradores";
import type { Cliente } from "@/hooks/queries/use-clientes";
import { useAuth } from "@/providers/auth-provider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type Step = 1 | 2 | 3;

const MODELO_OPTIONS = [
  { value: "cuota_fija", label: "Cuota fija" },
  { value: "solo_interes", label: "Solo interes" },
  { value: "sobre_saldo", label: "Sobre saldo" },
];

export default function NuevoPrestamoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const lockedCobrador =
    role === "cobrador" && user
      ? { id: user.id, nombre: user.nombreCompleto ?? "Tú" }
      : undefined;
  const [step, setStep] = useState<Step>(1);
  const [step1Data, setStep1Data] = useState<PrestamoStep1Data | null>(null);
  const [step2Data, setStep2Data] = useState<PrestamoStep2Data | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: clientes = [] } = useClientes({ activo: true });
  const { data: cobradores = [] } = useCobradores({ activo: true });

  const handleConfirm = useCallback(async () => {
    if (!step1Data || !step2Data) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/prestamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: step1Data.clienteId,
          capital: step2Data.capital,
          modeloInteres: step2Data.modeloInteres,
          tasaMensual: step2Data.tasaMensual,
          plazoDias: step2Data.plazoDias,
          fechaInicio: step2Data.fechaInicio,
          cobradorId: step2Data.cobradorId || null,
          excluirSabados: step2Data.excluirSabados,
          excluirDomingos: step2Data.excluirDomingos,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Error al crear el préstamo");
      }
      toast.success("Prestamo creado correctamente");
      void queryClient.invalidateQueries({ queryKey: ["prestamos"] });
      router.push("/app/prestamos");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear el préstamo";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [step1Data, step2Data, router, queryClient]);

  const STEP_LABELS = ["Cliente", "Condiciones", "Confirmar"];

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:max-w-xl">
      <button
        onClick={() => {
          if (step === 1) router.push("/app/prestamos");
          else setStep((s) => (s - 1) as Step);
        }}
        className="dash-rise group flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        {step === 1 ? "Volver a préstamos" : "Atrás"}
      </button>

      <div className="dash-rise" style={{ animationDelay: "40ms" }}>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Paso {step} de 3
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Nuevo préstamo
        </h1>
      </div>

      {/* Stepper */}
      <div
        className="dash-rise flex items-center gap-2"
        style={{ animationDelay: "80ms" }}
      >
        {STEP_LABELS.map((label, i) => {
          const num = (i + 1) as Step;
          const isDone = num < step;
          const isCurrent = num === step;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors ${
                    isDone
                      ? "bg-success/15 text-success"
                      : isCurrent
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : num}
                </span>
                <span
                  className={`hidden text-xs font-semibold sm:block ${
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <span
                  className={`h-px flex-1 ${isDone ? "bg-success/40" : "bg-border"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <Step1
          clientes={clientes}
          onNext={(data) => {
            setStep1Data(data);
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <Step2
          cobradores={cobradores}
          lockedCobrador={lockedCobrador}
          onNext={(data) => {
            setStep2Data(data);
            setStep(3);
          }}
        />
      )}
      {step === 3 && step1Data && step2Data && (
        <Step3
          clienteId={step1Data.clienteId}
          data={step2Data}
          clientes={clientes}
          cobradores={cobradores}
          onBack={() => setStep(2)}
          onConfirm={handleConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

function Step1({
  clientes,
  onNext,
}: {
  clientes: Cliente[];
  onNext: (data: PrestamoStep1Data) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrestamoStep1Data>({
    resolver: zodResolver(prestamoStep1Schema),
  });

  const clienteOptions = clientes.map((c) => ({
    value: c.id,
    label: `${c.nombre}${c.cedula ? ` · CC ${c.cedula}` : ""}`,
  }));

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-4"
    >
      <Select
        label="Cliente"
        options={clienteOptions}
        placeholder="Buscar cliente..."
        error={errors.clienteId?.message}
        searchable
        {...register("clienteId")}
      />

      <Button type="submit" className="w-full">
        Siguiente
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

function Step2({
  cobradores,
  lockedCobrador,
  onNext,
}: {
  cobradores: Cobrador[];
  lockedCobrador?: { id: string; nombre: string };
  onNext: (data: PrestamoStep2Data) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PrestamoStep2Data>({
    resolver: zodResolver(prestamoStep2Schema),
    defaultValues: {
      fechaInicio: today,
      excluirSabados: false,
      excluirDomingos: false,
      cobradorId: lockedCobrador?.id ?? "",
    },
  });

  const [capital, modeloInteres, tasaMensual, plazoDias] = useWatch({
    control,
    name: ["capital", "modeloInteres", "tasaMensual", "plazoDias"],
  });

  const preview = useMemo(() => {
    const c = Number(capital);
    const t = Number(tasaMensual);
    const p = Number(plazoDias);
    if (!c || !t || !p || !modeloInteres) return null;
    try {
      return calculateLoanTotals({
        capital: c,
        modelo: modeloInteres as LoanModel,
        plazoDias: p,
        tasaMensual: t,
      });
    } catch {
      return null;
    }
  }, [capital, modeloInteres, tasaMensual, plazoDias]);

  const cobradorOptions = [
    { value: "", label: "Sin cobrador asignado" },
    ...cobradores.map((c) => ({
      value: c.id,
      label: c.nombre_completo,
    })),
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <Input
          label="Capital"
          type="number"
          placeholder="1.500.000"
          error={errors.capital?.message}
          {...register("capital", { valueAsNumber: true })}
        />

        <Select
          label="Modelo de interes"
          options={MODELO_OPTIONS}
          placeholder="Selecciona un modelo"
          error={errors.modeloInteres?.message}
          {...register("modeloInteres")}
        />

        <Input
          label="Tasa mensual (%)"
          type="number"
          step="0.1"
          placeholder="10"
          error={errors.tasaMensual?.message}
          {...register("tasaMensual", { valueAsNumber: true })}
        />

        <Input
          label="Plazo (dias)"
          type="number"
          placeholder="30"
          error={errors.plazoDias?.message}
          {...register("plazoDias", { valueAsNumber: true })}
        />

      <Input
        label="Fecha de inicio"
        type="date"
        error={errors.fechaInicio?.message}
        {...register("fechaInicio")}
      />

      {lockedCobrador ? (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Cobrador</label>
          <div className="flex h-11 items-center rounded-lg border border-border bg-muted/50 px-3 text-sm text-foreground">
            {lockedCobrador.nombre} · autoasignado
          </div>
          <input type="hidden" {...register("cobradorId")} value={lockedCobrador.id} />
        </div>
      ) : (
        <Select
          label="Cobrador"
          options={cobradorOptions}
          error={errors.cobradorId?.message}
          searchable
          {...register("cobradorId")}
        />
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("excluirSabados")} className="h-4 w-4 rounded border-border" />
          Excluir sabados
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("excluirDomingos")} className="h-4 w-4 rounded border-border" />
          Excluir domingos
        </label>
      </div>

      {preview && (
        <Card padding="md" className="dash-rise border-primary/25 bg-primary/[0.06]">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Vista previa
          </p>
          <div className="grid grid-cols-2 divide-x divide-primary/15">
            <div className="pr-4">
              <p className="text-xs text-muted-foreground">Cuota diaria</p>
              <p className="mt-1 font-display text-lg font-bold tabular-nums text-primary">
                {formatCop(preview.cuotaDiaria)}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-muted-foreground">Total a pagar</p>
              <p className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">
                {formatCop(preview.totalPagar)}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Button type="submit" className="w-full">
        Siguiente
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

function Step3({
  clienteId,
  data,
  clientes,
  cobradores,
  onBack,
  onConfirm,
  isSubmitting,
}: {
  clienteId: string;
  data: PrestamoStep2Data;
  clientes: Cliente[];
  cobradores: Cobrador[];
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}) {
  const cliente = clientes.find((c) => c.id === clienteId);
  const cobrador = data.cobradorId
    ? cobradores.find((c) => c.id === data.cobradorId)
    : null;

  const totals = calculateLoanTotals({
    capital: data.capital,
    modelo: data.modeloInteres as LoanModel,
    plazoDias: data.plazoDias,
    tasaMensual: data.tasaMensual,
  });

  return (
    <div className="space-y-4">
      <Card padding="md" className="dash-rise p-5">
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight text-foreground">
          Resumen del préstamo
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium text-foreground">
              {cliente?.nombre ?? "Desconocido"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Capital</span>
            <span className="font-mono font-medium text-foreground">
              {formatCop(data.capital)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modelo</span>
            <span className="text-foreground">
              {data.modeloInteres.replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tasa mensual</span>
            <span className="text-foreground">{data.tasaMensual}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plazo</span>
            <span className="text-foreground">{data.plazoDias} dias</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha inicio</span>
            <span className="text-foreground">{data.fechaInicio}</span>
          </div>
          {cobrador && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cobrador</span>
              <span className="text-foreground">{cobrador.nombre_completo}</span>
            </div>
          )}
          {(data.excluirSabados || data.excluirDomingos) && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dias excluidos</span>
              <span className="text-foreground">
                {[
                  data.excluirSabados && "Sabados",
                  data.excluirDomingos && "Domingos",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-dashed border-border pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Cuota diaria</span>
            <span className="font-display text-xl font-bold tabular-nums text-primary">
              {formatCop(totals.cuotaDiaria)}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total a pagar</span>
            <span className="font-display text-xl font-bold tabular-nums text-foreground">
              {formatCop(totals.totalPagar)}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atras
        </Button>
        <Button type="button" onClick={onConfirm} className="flex-1" loading={isSubmitting}>
          <Check className="mr-2 h-4 w-4" />
          Confirmar
        </Button>
      </div>
    </div>
  );
}
