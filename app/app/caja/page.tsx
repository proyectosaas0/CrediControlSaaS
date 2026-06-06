"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wallet, TrendingUp, TrendingDown, Ban, CheckCircle, Banknote, Smartphone, ArrowRightLeft } from "lucide-react";
import { useCajaResumen } from "@/hooks/queries/use-caja";
import { formatCop } from "@/lib/domain/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";

const MEDIO_LABELS: Record<string, { label: string; Icon: React.ElementType }> = {
  efectivo: { label: "Efectivo", Icon: Banknote },
  nequi: { label: "Nequi", Icon: Smartphone },
  transferencia: { label: "Transferencia", Icon: ArrowRightLeft },
};

export default function CajaPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: resumen, isLoading, refetch } = useCajaResumen(today);

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando caja...</p>;
  }

  const breakdown = resumen?.breakdown ?? {};
  const mediosConPagos = Object.entries(breakdown).filter(([, v]) => v > 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Caja Diaria</h1>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Resumen del dia</h2>
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

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Recaudo por medio de pago</h2>
        {mediosConPagos.length === 0 ? (
          <Card padding="md">
            <p className="text-sm text-muted-foreground text-center">Sin pagos registrados hoy</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {mediosConPagos.map(([medio, monto]) => {
              const config = MEDIO_LABELS[medio] ?? { label: medio, Icon: Wallet };
              return (
                <Card key={medio} padding="md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <config.Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{config.label}</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-foreground">{formatCop(monto)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <CerrarRutaButton fecha={today} onSuccess={() => refetch()} />
        <CierreGeneralButton fecha={today} resumen={resumen} onSuccess={() => refetch()} />
      </div>
    </div>
  );
}

const cierreSchema = z.object({
  efectivoDeclarado: z
    .number({ error: "Ingresa un monto valido" })
    .nonnegative("El monto no puede ser negativo"),
});

function CerrarRutaButton({ fecha, onSuccess }: { fecha: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ efectivoDeclarado: number }>({
    resolver: zodResolver(cierreSchema),
  });

  async function onSubmit(data: { efectivoDeclarado: number }) {
    const res = await fetch("/api/caja/cierre-ruta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ efectivoDeclarado: data.efectivoDeclarado, fecha }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error?.message ?? "Error al registrar cierre");
      return;
    }
    toast.success("Cierre de ruta registrado correctamente");
    reset();
    setOpen(false);
    onSuccess();
  }

  return (
    <>
      <Button variant="success" size="sm" onClick={() => setOpen(true)} className="flex-1">
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Registrando..." : "Cerrar ruta"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

type CierreGeneralButtonProps = {
  fecha: string;
  resumen?: { totalEsperado: number; totalRecaudado: number; diferencia: number } | null;
  onSuccess: () => void;
};

function CierreGeneralButton({ fecha, resumen, onSuccess }: CierreGeneralButtonProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCierre() {
    setIsSubmitting(true);
    const res = await fetch("/api/caja/cierre-general", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha }),
    });
    const json = await res.json().catch(() => ({}));
    setIsSubmitting(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Error al registrar cierre general");
      return;
    }
    toast.success("Cierre general registrado correctamente");
    setOpen(false);
    onSuccess();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="flex-1">
        <Ban className="h-4 w-4" />
        Cierre general
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Cierre general">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Consolida y cierra la caja de todos los cobradores.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total esperado</span>
              <span className="font-mono font-medium">{formatCop(resumen?.totalEsperado ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total recaudado</span>
              <span className="font-mono font-medium text-success">{formatCop(resumen?.totalRecaudado ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diferencia</span>
              <span className="font-mono font-medium text-danger">{formatCop(resumen?.diferencia ?? 0)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={handleCierre} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Cerrando..." : "Cerrar caja general"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
