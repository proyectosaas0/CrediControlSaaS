"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  prestamoStep1Schema,
  prestamoStep2Schema,
  type PrestamoStep1Data,
  type PrestamoStep2Data,
} from "@/lib/schemas/admin";
import { calculateLoanTotals, type LoanModel } from "@/lib/domain/loans";
import { formatCop } from "@/lib/domain/money";
import { apiClient } from "@/lib/api/client";
import { useClientes, useCobradores } from "@/lib/hooks";
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
  const [step, setStep] = useState<Step>(1);
  const [step1Data, setStep1Data] = useState<PrestamoStep1Data | null>(null);
  const [step2Data, setStep2Data] = useState<PrestamoStep2Data | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (!step1Data || !step2Data) return;
    setSubmitting(true);
    try {
      const payload = {
        capital: step2Data.capital,
        clienteId: step1Data.clienteId,
        cobradorId: step2Data.cobradorId || null,
        excluirDomingos: step2Data.excluirDomingos,
        excluirSabados: step2Data.excluirSabados,
        fechaInicio: step2Data.fechaInicio,
        modeloInteres: step2Data.modeloInteres,
        plazoDias: step2Data.plazoDias,
        tasaMensual: step2Data.tasaMensual,
      };
      const result = await apiClient.post<{ id: string }>("/prestamos", payload);
      toast.success("Prestamo creado correctamente");
      router.push(`/app/prestamos/${result.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear prestamo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <button
        onClick={() => {
          if (step === 1) router.push("/app/prestamos");
          else setStep((s) => (s - 1) as Step);
        }}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === 1 ? "Volver a prestamos" : "Atras"}
      </button>

      <h1 className="text-2xl font-bold text-foreground">Nuevo prestamo</h1>

      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Paso {step} de 3 —{" "}
        {step === 1
          ? "Seleccionar cliente"
          : step === 2
            ? "Condiciones del prestamo"
            : "Confirmar prestamo"}
      </p>

      {step === 1 && (
        <Step1
          onNext={(data) => {
            setStep1Data(data);
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <Step2
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
          onBack={() => setStep(2)}
          onConfirm={handleConfirm}
          submitting={submitting}
        />
      )}
    </div>
  );
}

function Step1({ onNext }: { onNext: (data: PrestamoStep1Data) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrestamoStep1Data>({
    resolver: zodResolver(prestamoStep1Schema),
  });

  const { data: clientes = [] } = useClientes();

  const clienteOptions = clientes
    .filter((c) => c.activo)
    .map((c) => ({
      value: c.id,
      label: `${c.nombre}${c.cedula ? ` · CC ${c.cedula}` : ""}`,
    }));

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <Select
        label="Cliente"
        options={clienteOptions}
        placeholder="Selecciona un cliente"
        error={errors.clienteId?.message}
        {...register("clienteId")}
      />

      <Button type="submit" className="w-full">
        Siguiente
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

function Step2({ onNext }: { onNext: (data: PrestamoStep2Data) => void }) {
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PrestamoStep2Data>({
    resolver: zodResolver(prestamoStep2Schema),
    defaultValues: {
      fechaInicio: today,
      excluirSabados: false,
      excluirDomingos: false,
      cobradorId: "",
    },
  });

  const [capital, modeloInteres, tasaMensual, plazoDias] = watch([
    "capital",
    "modeloInteres",
    "tasaMensual",
    "plazoDias",
  ]);

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

  const { data: cobradores = [] } = useCobradores();

  const cobradorOptions = [
    { value: "", label: "Sin cobrador asignado" },
    ...cobradores
      .filter((c) => c.activo)
      .map((c) => ({
        value: c.id,
        label: c.nombre,
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

      <Select
        label="Cobrador"
        options={cobradorOptions}
        error={errors.cobradorId?.message}
        {...register("cobradorId")}
      />

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
        <Card padding="md" className="bg-primary/5 border-primary/20">
          <p className="text-xs text-muted-foreground mb-2">Vista previa</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Cuota diaria:</span>
            <span className="font-bold font-mono text-foreground">
              {formatCop(preview.cuotaDiaria)}
            </span>
            <span className="text-muted-foreground">Total a pagar:</span>
            <span className="font-bold font-mono text-foreground">
              {formatCop(preview.totalPagar)}
            </span>
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
  onBack,
  onConfirm,
  submitting,
}: {
  clienteId: string;
  data: PrestamoStep2Data;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  const { data: clientes = [] } = useClientes();
  const { data: cobradores = [] } = useCobradores();

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
      <Card padding="md">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Resumen del prestamo
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
              <span className="text-foreground">{cobrador.nombre}</span>
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

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cuota diaria</span>
            <span className="text-lg font-bold font-mono text-primary">
              {formatCop(totals.cuotaDiaria)}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted-foreground">Total a pagar</span>
            <span className="text-lg font-bold font-mono text-foreground">
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
        <Button type="button" onClick={onConfirm} disabled={submitting} className="flex-1">
          <Check className="mr-2 h-4 w-4" />
          Confirmar
        </Button>
      </div>
    </div>
  );
}
