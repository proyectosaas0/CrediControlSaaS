"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wallet, TrendingUp, TrendingDown, Percent, Clock, Ban, CheckCircle } from "lucide-react";
import {
  MOCK_CAJA_RESUMEN,
  MOCK_CAJA_COBRADORES,
  MOCK_PAGOS_HOY,
  MOCK_CIERRES_CAJA,
} from "@/lib/mock/caja";
import { formatCop } from "@/lib/domain/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/components/ui/cn";
import { toast } from "sonner";

const medioLabels: Record<string, string> = {
  efectivo: "Efectivo",
  nequi: "Nequi",
  transferencia: "Transferencia",
};

const medioColors: Record<string, string> = {
  efectivo: "bg-success text-white",
  nequi: "bg-primary text-white",
  transferencia: "bg-info text-white",
};

export default function CajaPage() {
  const resumen = MOCK_CAJA_RESUMEN;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Caja Diaria</h1>

      {/* Resumen del dia */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Resumen del dia
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card padding="md">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-xs text-muted-foreground">Total esperado</p>
            </div>
            <p className="text-lg font-bold font-mono text-foreground mt-1">
              {formatCop(resumen.totalEsperado)}
            </p>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Recaudado</p>
            </div>
            <p className="text-lg font-bold font-mono text-success mt-1">
              {formatCop(resumen.totalRecaudado)}
            </p>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-danger" />
              <p className="text-xs text-muted-foreground">Diferencia</p>
            </div>
            <p className="text-lg font-bold font-mono text-danger mt-1">
              {formatCop(resumen.diferencia)}
            </p>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Cumplimiento</p>
            </div>
            <p className="text-lg font-bold text-primary mt-1">
              {resumen.cumplimiento}%
            </p>
          </Card>
        </div>
      </div>

      {/* Desglose por medio de pago */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Desglose por medio de pago
        </h2>
        <div className="flex gap-3">
          {Object.entries(resumen.desgloseMedioPago).map(([medio, monto]) => (
            <Card key={medio} padding="sm" className="flex-1 text-center">
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-xs font-medium mb-1",
                  medioColors[medio] ?? "bg-muted text-muted-foreground",
                )}
              >
                {medioLabels[medio] ?? medio}
              </span>
              <p className="text-sm font-bold font-mono text-foreground">
                {formatCop(monto)}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round((monto / resumen.totalRecaudado) * 100)}%
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Rendimiento por cobrador */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Rendimiento por cobrador
        </h2>
        <div className="space-y-2">
          {MOCK_CAJA_COBRADORES.map((cb) => (
            <Card key={cb.id} padding="md">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{cb.nombre}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    cb.cumplimiento >= 90
                      ? "bg-success/15 text-success"
                      : cb.cumplimiento >= 70
                        ? "bg-warning/15 text-warning"
                        : "bg-danger/15 text-danger",
                  )}
                >
                  {cb.cumplimiento}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Esperado: {formatCop(cb.totalEsperado)}</span>
                <span>Recaudado: {formatCop(cb.totalRecaudado)}</span>
                <span>Dif: {formatCop(cb.diferencia)}</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-muted">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    cb.cumplimiento >= 90
                      ? "bg-success"
                      : cb.cumplimiento >= 70
                        ? "bg-warning"
                        : "bg-danger",
                  )}
                  style={{ width: `${Math.min(cb.cumplimiento, 100)}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pagos del dia */}
      <PagosDelDia />

      {/* Cierres */}
      <div className="flex gap-3">
        <CerrarRutaButton />
        <CierreGeneralButton />
      </div>

      {/* Historial */}
      <HistorialCierres />
    </div>
  );
}

function PagosDelDia() {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? MOCK_PAGOS_HOY : MOCK_PAGOS_HOY.slice(0, 5);

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">
        Pagos del dia
      </h2>
      {MOCK_PAGOS_HOY.length === 0 ? (
        <Card padding="md">
          <p className="text-center text-sm text-muted-foreground">
            Sin pagos registrados hoy
          </p>
        </Card>
      ) : (
        <div className="space-y-1">
          {display.map((pago) => (
            <Card key={pago.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {pago.clienteNombre}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{pago.hora}</span>
                    <span>·</span>
                    <span>{pago.cobradorNombre}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-foreground">
                    {formatCop(pago.monto)}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      medioColors[pago.medioPago] ?? "bg-muted",
                    )}
                  >
                    {medioLabels[pago.medioPago] ?? pago.medioPago}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {MOCK_PAGOS_HOY.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {showAll ? "Ver menos" : `Ver todos (${MOCK_PAGOS_HOY.length})`}
        </button>
      )}
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

function CierreGeneralButton() {
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
                {formatCop(MOCK_CAJA_RESUMEN.totalEsperado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total recaudado</span>
              <span className="font-mono font-medium text-success">
                {formatCop(MOCK_CAJA_RESUMEN.totalRecaudado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diferencia</span>
              <span className="font-mono font-medium text-danger">
                {formatCop(MOCK_CAJA_RESUMEN.diferencia)}
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

function HistorialCierres() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">
        Historial de cierres
      </h2>
      {MOCK_CIERRES_CAJA.length === 0 ? (
        <Card padding="md">
          <p className="text-center text-sm text-muted-foreground">
            Sin cierres registrados
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {MOCK_CIERRES_CAJA.map((cierre) => (
            <Card key={cierre.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {cierre.fecha}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        cierre.tipo === "general"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {cierre.tipo === "general" ? "General" : "Ruta"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cierre.cobradorNombre} · Cerrado por {cierre.cerradoPor}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-mono text-foreground">
                    {formatCop(cierre.totalRecaudado)}
                  </p>
                  {cierre.diferencia > 0 && (
                    <p className="text-danger">
                      Dif: {formatCop(cierre.diferencia)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
