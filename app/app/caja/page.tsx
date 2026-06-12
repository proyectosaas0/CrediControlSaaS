"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
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
import { PageHeader, SectionHead } from "@/components/ui/page-header";
import { SkeletonGrid } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/cn";
import { toast } from "sonner";

const MEDIO_LABELS: Record<string, { label: string; Icon: React.ElementType }> = {
  efectivo: { label: "Efectivo", Icon: Banknote },
  nequi: { label: "Nequi", Icon: Smartphone },
  transferencia: { label: "Transferencia", Icon: ArrowRightLeft },
};

export default function CajaPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { effectiveOrgId } = useAuth();
  const { data: resumen, isLoading, refetch } = useCajaResumen(today, { enabled: !!effectiveOrgId });

  const breakdown = resumen?.breakdown ?? {};
  const mediosConPagos = Object.entries(breakdown).filter(([, v]) => v > 0);
  const totalRecaudado = resumen?.totalRecaudado ?? 0;
  const diferencia = resumen?.diferencia ?? 0;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title="Caja diaria"
        subtitle="Consolidado de recaudo y cierres del día"
      />

      {isLoading ? (
        <SkeletonGrid count={3} cols={3} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CajaStat
            icon={TrendingUp}
            label="Total esperado"
            value={formatCop(resumen?.totalEsperado ?? 0)}
            chip="bg-primary/15 text-primary"
            delay={60}
          />
          <CajaStat
            icon={Wallet}
            label="Recaudado"
            value={formatCop(totalRecaudado)}
            chip="bg-success/15 text-success"
            valueClass="text-success"
            delay={120}
          />
          <CajaStat
            icon={TrendingDown}
            label="Diferencia"
            value={formatCop(diferencia)}
            chip={diferencia > 0 ? "bg-danger/15 text-danger" : "bg-muted text-muted-foreground"}
            valueClass={diferencia > 0 ? "text-danger" : undefined}
            delay={180}
          />
        </div>
      )}

      <section className="dash-rise" style={{ animationDelay: "240ms" }}>
        <SectionHead title="Recaudo por medio de pago" />
        {!isLoading && mediosConPagos.length === 0 ? (
          <Card padding="md" className="border-dashed">
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin pagos registrados hoy
            </p>
          </Card>
        ) : (
          <Card padding="none" className="divide-y divide-border overflow-hidden">
            {mediosConPagos.map(([medio, monto]) => {
              const config = MEDIO_LABELS[medio] ?? { label: medio, Icon: Wallet };
              const share = totalRecaudado > 0 ? (monto / totalRecaudado) * 100 : 0;
              return (
                <div key={medio} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <config.Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{config.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-sm font-bold tabular-nums text-foreground">
                        {formatCop(monto)}
                      </span>
                      <span className="ml-2 text-[11px] tabular-nums text-muted-foreground">
                        {Math.round(share)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="dash-fill h-full rounded-full bg-gradient-to-r from-primary to-violet-400"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </section>

      <div className="dash-rise flex gap-3" style={{ animationDelay: "320ms" }}>
        <CerrarRutaButton fecha={today} onSuccess={() => refetch()} />
        <CierreGeneralButton fecha={today} resumen={resumen} onSuccess={() => refetch()} />
      </div>
    </div>
  );
}

function CajaStat({
  icon: Icon,
  label,
  value,
  chip,
  valueClass,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  chip: string;
  valueClass?: string;
  delay: number;
}) {
  return (
    <div
      className="dash-rise flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 backdrop-blur-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", chip)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 truncate font-display text-xl font-bold leading-none tracking-tight text-foreground tabular-nums",
            valueClass,
          )}
        >
          {value}
        </p>
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
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Cerrar ruta
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
            <Button type="button" variant="danger" onClick={handleCierre} loading={isSubmitting} className="flex-1">
              Cerrar caja general
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
