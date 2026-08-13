"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { formatCop } from "@/lib/domain/money";
import { MEDIOS_PAGO, type MedioPago } from "@/lib/mock/ruta-types";
import type { RouteItem } from "@/lib/mock/ruta";
import { CheckCircle2, Loader2, MessageSquare, UserX } from "lucide-react";
import { postApi } from "@/hooks/queries/fetch-api";
import { toast } from "sonner";

export type ReceiptRequest = {
  item: RouteItem;
  medioPago: MedioPago;
  monto: number;
  tipo: string;
  /** Saldo del préstamo después de este pago. */
  saldo: number;
};

type PaymentSheetProps = {
  items: RouteItem[];
  open: boolean;
  onClose: () => void;
  onPaymentSuccess: (itemIds: string[], medioPago: MedioPago, monto: number) => void;
  onMarkNotFound: (itemId: string) => void;
  /** Abre el comprobante del pago recién registrado (solo pagos individuales). */
  onSendReceipt: (request: ReceiptRequest) => void;
};

type PaymentStep = "form" | "success";

export function PaymentSheet({
  items,
  open,
  onClose,
  onPaymentSuccess,
  onMarkNotFound,
  onSendReceipt,
}: PaymentSheetProps) {
  const [medioPago, setMedioPago] = useState<MedioPago | null>(null);
  const [monto, setMonto] = useState<string>("");
  const [isPartial, setIsPartial] = useState(false);
  const [isAbono, setIsAbono] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<PaymentStep>("form");
  const [paidCount, setPaidCount] = useState(0);

  if (items.length === 0) return null;

  const isBatch = items.length > 1;
  const item = items[0];
  const cuotaLabel = item.cuotaTotal ? `${item.cuotaNumero}/${item.cuotaTotal}` : `${item.cuotaNumero}`;

  const batchTotal = items.reduce((sum, i) => sum + Math.max(i.saldoPendiente, 0), 0);
  const montoNumerico = isBatch
    ? batchTotal
    : monto
      ? Number(monto.replace(/\D/g, ""))
      : item.montoEsperado;
  const isFormValid = medioPago !== null && montoNumerico > 0;
  const tipoPago = isAbono
    ? "abono"
    : isPartial
      ? "parcial"
      : item.estado === "mora"
        ? "mora"
        : "cuota";

  function handleMedioPagoSelect(mp: MedioPago) {
    setMedioPago((prev) => (prev === mp ? null : mp));
  }

  async function handleRegisterPayment() {
    if (!medioPago) return;
    setSubmitting(true);

    try {
      if (isBatch) {
        const results = await Promise.allSettled(
          items.map((it) => {
            const saldoPendiente = Math.max(it.saldoPendiente, 0);
            return postApi("/api/pagos", {
              cronogramaPagoId: it.id,
              medioPago,
              monto: saldoPendiente,
              tipo: it.estado === "mora" ? "mora" : "cuota",
            });
          }),
        );
        const succeededIds = items
          .filter((_, idx) => results[idx].status === "fulfilled")
          .map((it) => it.id);
        const failedCount = results.length - succeededIds.length;

        if (succeededIds.length > 0) {
          onPaymentSuccess(succeededIds, medioPago, montoNumerico);
          setPaidCount(succeededIds.length);
          setStep("success");
        }
        if (failedCount > 0) {
          toast.error(`${failedCount} de ${items.length} pagos no se pudieron registrar`);
        }
        if (succeededIds.length === 0) return;
      } else {
        await postApi("/api/pagos", {
          cronogramaPagoId: item.id,
          medioPago,
          monto: montoNumerico,
          tipo: tipoPago,
        });
        onPaymentSuccess([item.id], medioPago, montoNumerico);
        setPaidCount(1);
        setStep("success");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el pago");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNotFound() {
    setSubmitting(true);

    try {
      await postApi("/api/ruta/visitas", {
        cronogramaPagoId: item.id,
        resultado: "no_encontrado",
      });
      onMarkNotFound(item.id);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la visita");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      title={
        step === "success"
          ? "Pago exitoso"
          : isBatch
            ? `${items.length} clientes seleccionados`
            : `${item.clienteNombre} · Cuota ${cuotaLabel}`
      }
    >
      {step === "form" ? (
        <div className="space-y-5 pb-6">
          {isBatch && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Clientes seleccionados
              </label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border-2 border-border/60 bg-gradient-to-b from-muted/20 to-background p-3">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-2 rounded-lg bg-background/50 px-3 py-2.5 border border-border/40 hover:bg-muted/30 transition-all">
                    <span className="truncate text-sm font-medium text-foreground">{it.clienteNombre}</span>
                    <span className="shrink-0 font-bold tabular-nums text-primary/80">
                      {formatCop(it.montoEsperado)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              Monto {isBatch ? "total" : ""}
            </label>
            {!isBatch && isPartial ? (
              <input
                type="text"
                inputMode="numeric"
                value={monto}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setMonto(raw ? String(Number(raw)) : "");
                }}
                placeholder={String(item.montoEsperado)}
                className="flex h-14 w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-xl font-bold text-foreground placeholder:text-muted-foreground/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
              />
            ) : (
              <div className="flex h-14 items-center rounded-lg border-2 border-border bg-gradient-to-br from-muted/40 to-muted/20 px-4 text-xl font-bold text-foreground transition-all">
                {formatCop(montoNumerico)}
              </div>
            )}
            {!isBatch && (
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPartial((prev) => !prev);
                    setMonto("");
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 border-2",
                    isPartial
                      ? "border-primary bg-primary/15 text-primary shadow-md shadow-primary/20 scale-105"
                      : "border-border/50 bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-primary/8 hover:text-primary/80",
                  )}
                >
                  {isPartial && <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">✓</span>}
                  Pago parcial
                </button>
                <button
                  type="button"
                  onClick={() => setIsAbono((prev) => !prev)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 border-2",
                    isAbono
                      ? "border-primary bg-primary/15 text-primary shadow-md shadow-primary/20 scale-105"
                      : "border-border/50 bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-primary/8 hover:text-primary/80",
                  )}
                >
                  {isAbono && <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">✓</span>}
                  Abono a capital
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-sm font-semibold text-foreground">
              Método de pago
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MEDIOS_PAGO.map((mp) => (
                <button
                  key={mp.value}
                  type="button"
                  onClick={() => handleMedioPagoSelect(mp.value)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 px-3 py-4 transition-all duration-200 min-h-[90px] sm:min-h-[100px]",
                    "hover:scale-105 active:scale-95",
                    medioPago === mp.value
                      ? "border-primary bg-primary/12 shadow-md shadow-primary/20"
                      : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/30",
                  )}
                >
                  {medioPago === mp.value && (
                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                  {(() => {
                    const Icon = mp.icon;
                    return (
                      <Icon
                        className={cn(
                          "h-7 w-7 transition-all",
                          medioPago === mp.value ? "text-primary" : "text-muted-foreground",
                        )}
                        aria-hidden="true"
                      />
                    );
                  })()}
                  <span className={cn(
                    "text-center text-sm font-semibold transition-all leading-tight",
                    medioPago === mp.value ? "text-foreground" : "text-muted-foreground",
                  )}>
                    {mp.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="success"
              size="lg"
              className={cn(
                "h-14 w-full text-base font-bold shadow-lg transition-all",
                isFormValid && !submitting ? "hover:shadow-xl hover:scale-[1.02] active:scale-95" : "",
              )}
              disabled={!isFormValid || submitting}
              onClick={handleRegisterPayment}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              {isBatch ? `Registrar ${items.length} pagos` : "Registrar pago"}
            </Button>

            {!isBatch && (
              <button
                type="button"
                onClick={handleNotFound}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-border py-3 text-sm font-medium text-muted-foreground transition-all hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 min-h-11 disabled:opacity-50"
              >
                <UserX className="h-4 w-4" />
                Cliente no encontrado
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 pb-8 pt-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/15 shadow-lg shadow-success/20 ring-4 ring-success/10">
            <CheckCircle2 className="h-12 w-12 text-success animate-in fade-in zoom-in duration-300" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-foreground">
              ¡Pago registrado!
            </p>
            <p className="text-3xl font-black text-primary">
              {formatCop(montoNumerico)}
            </p>
            <p className="text-sm text-muted-foreground/80">
              {isBatch
                ? `${paidCount} cliente${paidCount !== 1 ? "s" : ""} · ${MEDIOS_PAGO.find((m) => m.value === medioPago)?.label}`
                : `${item.clienteNombre} · ${MEDIOS_PAGO.find((m) => m.value === medioPago)?.label} · Cuota ${cuotaLabel}`}
            </p>
          </div>

          {!isBatch && medioPago && (
            <Button
              variant="success"
              size="lg"
              className="w-full text-base font-bold"
              onClick={() =>
                onSendReceipt({
                  item,
                  medioPago,
                  monto: montoNumerico,
                  tipo: tipoPago,
                  saldo: Math.max(item.saldoPendiente - montoNumerico, 0),
                })
              }
            >
              <MessageSquare className="h-5 w-5" />
              Enviar comprobante
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={onClose}
          >
            Continuar cobrando
          </Button>
        </div>
      )}
    </Sheet>
  );
}
