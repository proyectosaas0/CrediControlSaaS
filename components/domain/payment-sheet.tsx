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
import { MOCK_NEGOCIO, MOCK_COBRADOR } from "@/lib/mock/ruta";

type PaymentSheetProps = {
  item: RouteItem | null;
  open: boolean;
  onClose: () => void;
  onPaymentSuccess: (itemId: string, medioPago: MedioPago, monto: number) => void;
  onMarkNotFound: (itemId: string) => void;
};

type PaymentStep = "form" | "success";

export function PaymentSheet({
  item,
  open,
  onClose,
  onPaymentSuccess,
  onMarkNotFound,
}: PaymentSheetProps) {
  const [medioPago, setMedioPago] = useState<MedioPago | null>(null);
  const [monto, setMonto] = useState<string>("");
  const [isPartial, setIsPartial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<PaymentStep>("form");
  const { buildLink } = useWhatsApp();

  if (!item) return null;

  const montoNumerico = monto ? Number(monto.replace(/\D/g, "")) : item.montoEsperado;
  const isFormValid = medioPago !== null && montoNumerico > 0;

  function handleOpen() {
    setMedioPago(null);
    setMonto("");
    setIsPartial(false);
    setSubmitting(false);
    setStep("form");
  }

  function handleMedioPagoSelect(mp: MedioPago) {
    setMedioPago((prev) => (prev === mp ? null : mp));
  }

  async function handleRegisterPayment() {
    if (!medioPago || !item) return;
    setSubmitting(true);

    // TODO: Reemplazar por POST /api/pagos
    await new Promise((resolve) => setTimeout(resolve, 800));

    onPaymentSuccess(item.id, medioPago, montoNumerico);
    setSubmitting(false);
    setStep("success");
  }

  async function handleNotFound() {
    if (!item) return;
    setSubmitting(true);

    // TODO: Reemplazar por POST /api/ruta/visitas con resultado: 'no_encontrado'
    await new Promise((resolve) => setTimeout(resolve, 500));

    onMarkNotFound(item.id);
    setSubmitting(false);
    onClose();
  }

  const whatsappLink =
    step === "success"
      ? buildLink({
          telefono: item.clienteTelefono,
          negocio: MOCK_NEGOCIO,
          cliente: item.clienteNombre,
          monto: montoNumerico,
          medioPago: MEDIOS_PAGO.find((m) => m.value === medioPago)?.label ?? "",
          cuota: `${item.cuotaNumero}/${item.cuotaTotal}`,
          saldo: item.saldoPendiente - montoNumerico,
          cobrador: MOCK_COBRADOR,
          fecha: new Date().toLocaleString("es-CO"),
        })
      : "";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      title={step === "success" ? "Pago exitoso" : `${item.clienteNombre} · Cuota ${item.cuotaNumero}/${item.cuotaTotal}`}
    >
      {step === "form" ? (
        <div className="space-y-4 pb-6" onTransitionEnd={handleOpen}>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Monto
            </label>
            {isPartial ? (
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
                {formatCop(item.montoEsperado)}
              </div>
            )}
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
                  <span className="text-xl" aria-hidden="true">{mp.icon}</span>
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
            Registrar pago
          </Button>

          <button
            type="button"
            onClick={handleNotFound}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm text-muted-foreground transition-colors hover:bg-muted min-h-11"
          >
            <UserX className="h-4 w-4" />
            Cliente no encontrado
          </button>
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
              {item.clienteNombre} · {MEDIOS_PAGO.find((m) => m.value === medioPago)?.label}
            </p>
          </div>

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
