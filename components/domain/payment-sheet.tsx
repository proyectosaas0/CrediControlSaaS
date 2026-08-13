"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button, buttonClasses } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { formatCop } from "@/lib/domain/money";
import { MEDIOS_PAGO, type MedioPago } from "@/lib/mock/ruta-types";
import type { RouteItem } from "@/lib/mock/ruta";
import { CheckCircle2, Loader2, MessageSquare, UserX } from "lucide-react";
import { useWhatsApp } from "@/hooks/use-whatsapp";
import { useAuthMe } from "@/hooks/queries/use-auth-me";
import { postApi } from "@/hooks/queries/fetch-api";
import { toast } from "sonner";

type PaymentSheetProps = {
  items: RouteItem[];
  open: boolean;
  onClose: () => void;
  onPaymentSuccess: (itemIds: string[], medioPago: MedioPago, monto: number) => void;
  onMarkNotFound: (itemId: string) => void;
};

type PaymentStep = "form" | "success";

export function PaymentSheet({
  items,
  open,
  onClose,
  onPaymentSuccess,
  onMarkNotFound,
}: PaymentSheetProps) {
  const [medioPago, setMedioPago] = useState<MedioPago | null>(null);
  const [monto, setMonto] = useState<string>("");
  const [isPartial, setIsPartial] = useState(false);
  const [isAbono, setIsAbono] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<PaymentStep>("form");
  const [paidCount, setPaidCount] = useState(0);
  const { buildLink } = useWhatsApp();
  const { data: me } = useAuthMe();

  if (items.length === 0) return null;

  const isBatch = items.length > 1;
  const item = items[0];
  const cuotaLabel = item.cuotaTotal ? `${item.cuotaNumero}/${item.cuotaTotal}` : `${item.cuotaNumero}`;

  const batchTotal = items.reduce((sum, i) => sum + i.montoEsperado, 0);
  const montoNumerico = isBatch
    ? batchTotal
    : monto
      ? Number(monto.replace(/\D/g, ""))
      : item.montoEsperado;
  const isFormValid = medioPago !== null && montoNumerico > 0;

  function handleOpen() {
    setMedioPago(null);
    setMonto("");
    setIsPartial(false);
    setIsAbono(false);
    setSubmitting(false);
    setStep("form");
    setPaidCount(0);
  }

  function handleMedioPagoSelect(mp: MedioPago) {
    setMedioPago((prev) => (prev === mp ? null : mp));
  }

  async function handleRegisterPayment() {
    if (!medioPago) return;
    setSubmitting(true);

    try {
      if (isBatch) {
        const results = await Promise.allSettled(
          items.map((it) =>
            postApi("/api/pagos", {
              cronogramaPagoId: it.id,
              medioPago,
              monto: it.montoEsperado,
              tipo: it.estado === "mora" ? "mora" : "cuota",
            }),
          ),
        );
        const succeededIds = items
          .filter((_, idx) => results[idx].status === "fulfilled")
          .map((it) => it.id);
        const failedCount = results.length - succeededIds.length;

        if (succeededIds.length > 0) {
          onPaymentSuccess(succeededIds, medioPago, montoNumerico);
        }
        if (failedCount > 0) {
          toast.error(`${failedCount} de ${items.length} pagos no se pudieron registrar`);
        }
        if (succeededIds.length === 0) return;

        setPaidCount(succeededIds.length);
        setStep("success");
      } else {
        await postApi("/api/pagos", {
          cronogramaPagoId: item.id,
          medioPago,
          monto: montoNumerico,
          tipo: isAbono ? "abono" : isPartial ? "parcial" : item.estado === "mora" ? "mora" : "cuota",
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

  const whatsappLink =
    step === "success" && !isBatch
      ? buildLink({
          telefono: item.clienteTelefono,
          negocio: me?.organization?.nombre_negocio ?? "",
          cliente: item.clienteNombre,
          monto: montoNumerico,
          medioPago: MEDIOS_PAGO.find((m) => m.value === medioPago)?.label ?? "",
          cuota: cuotaLabel,
          saldo: item.saldoPendiente - montoNumerico,
          cobrador: me?.profile?.nombre_completo ?? "",
          fecha: new Date().toLocaleString("es-CO"),
        })
      : "";

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
        <div className="space-y-4 pb-6">
          {isBatch && (
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-foreground">{it.clienteNombre}</span>
                  <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
                    {formatCop(it.montoEsperado)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
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
                className="flex h-12 min-h-12 w-full rounded-lg border border-border bg-background px-3 py-2 text-lg font-semibold text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <div className="flex h-12 min-h-12 items-center rounded-lg border border-border bg-muted/50 px-3 text-lg font-semibold text-foreground">
                {formatCop(montoNumerico)}
              </div>
            )}
            {!isBatch && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPartial((prev) => !prev);
                    setMonto("");
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {isPartial ? "Usar monto completo" : "Pago parcial"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAbono((prev) => !prev)}
                  className="text-xs text-primary hover:underline"
                >
                  {isAbono ? "Pago a cuota" : "Abono a capital"}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Medio de pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MEDIOS_PAGO.map((mp) => (
                <button
                  key={mp.value}
                  type="button"
                  onClick={() => handleMedioPagoSelect(mp.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-center transition-colors min-h-[60px]",
                    medioPago === mp.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-muted-foreground/30",
                  )}
                >
                  {(() => {
                    const Icon = mp.icon;
                    return <Icon className="h-6 w-6" aria-hidden="true" />;
                  })()}
                  <span className="text-xs font-medium text-foreground">
                    {mp.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="success"
            size="lg"
            className="h-14 w-full text-base font-bold"
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
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11"
            >
              <UserX className="h-4 w-4" />
              Cliente no encontrado
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 pb-8 pt-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>

          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {formatCop(montoNumerico)} registrados
            </p>
            <p className="text-sm text-muted-foreground">
              {isBatch
                ? `${paidCount} cliente${paidCount !== 1 ? "s" : ""} · ${MEDIOS_PAGO.find((m) => m.value === medioPago)?.label}`
                : `${item.clienteNombre} · ${MEDIOS_PAGO.find((m) => m.value === medioPago)?.label} · Cuota ${cuotaLabel}`}
            </p>
          </div>

          {!isBatch && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonClasses("success", "lg"),
                "w-full text-base font-bold",
              )}
            >
              <MessageSquare className="h-5 w-5" />
              Enviar comprobante WhatsApp
            </a>
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
