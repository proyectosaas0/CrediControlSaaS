"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wallet, TrendingUp, TrendingDown, Percent, Ban, CheckCircle } from "lucide-react";
import { useCajaResumen } from "@/hooks/queries/use-caja";
import { formatCop } from "@/lib/domain/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CajaPage() {
  const { data: resumen, isLoading } = useCajaResumen();

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando caja...</p>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Caja Diaria</h1>

      {/* Resumen del dia */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Resumen del dia
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card padding="md">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-xs text-muted-foreground">Total esperado</p>
            </div>
            <p className="text-lg font-bold font-mono text-foreground mt-1">
              {formatCop(resumen?.totalEsperado ?? 0)}
            </p>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Recaudado</p>
            </div>
            <p className="text-lg font-bold font-mono text-success mt-1">
              {formatCop(resumen?.totalRecaudado ?? 0)}
            </p>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-danger" />
              <p className="text-xs text-muted-foreground">Diferencia</p>
            </div>
            <p className="text-lg font-bold font-mono text-danger mt-1">
              {formatCop(resumen?.diferencia ?? 0)}
            </p>
          </Card>
        </div>
      </div>

      {/* Detalle cobradores */}
      <Card padding="md">
        <p className="text-sm text-muted-foreground text-center">Detalle disponible próximamente</p>
      </Card>

      {/* Acciones de cierre */}
      <div className="flex gap-3">
        <CerrarRutaButton />
        <CierreGeneralButton resumen={resumen} />
      </div>
    </div>
  );
}

const cierreSchema = z.object({
  efectivoDeclarado: z
    .number({ message: "Ingresa un monto valido" })
    .positive("El monto debe ser mayor a 0"),
});

function CerrarRutaButton() {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ efectivoDeclarado: number }>({
    resolver: zodResolver(cierreSchema),
  });

  function onSubmit() {
    toast.success("Cierre de ruta registrado correctamente");
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="success"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex-1"
      >
        <CheckCircle className="h-4 w-4" />
        Cerrar mi ruta
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Cerrar mi ruta">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Declara el efectivo recaudado en tu ruta de hoy.
          </p>
          <Input
            label="Efectivo declarado"
            type="number"
            error={errors.efectivoDeclarado?.message}
            {...register("efectivoDeclarado", { valueAsNumber: true })}
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              Cerrar ruta
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

type CierreGeneralButtonProps = {
  resumen?: { totalEsperado: number; totalRecaudado: number; diferencia: number } | null;
};

function CierreGeneralButton({ resumen }: CierreGeneralButtonProps) {
  const [open, setOpen] = useState(false);

  function handleCierre() {
    toast.success("Cierre general registrado correctamente");
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="flex-1">
        <Ban className="h-4 w-4" />
        Cierre general
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Cierre general"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Consolida y cierra la caja de todos los cobradores.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total esperado</span>
              <span className="font-mono font-medium">
                {formatCop(resumen?.totalEsperado ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total recaudado</span>
              <span className="font-mono font-medium text-success">
                {formatCop(resumen?.totalRecaudado ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diferencia</span>
              <span className="font-mono font-medium text-danger">
                {formatCop(resumen?.diferencia ?? 0)}
              </span>
            </div>
          </div>
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
              variant="danger"
              onClick={handleCierre}
              className="flex-1"
            >
              Cerrar caja general
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
