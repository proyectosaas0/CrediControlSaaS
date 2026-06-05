import { buildReceiptMessage } from "@/lib/domain/whatsapp";

type WhatsAppPayload = {
  telefono: string;
  negocio: string;
  cliente: string;
  monto: number;
  medioPago: string;
  cuota: string;
  saldo: number;
  cobrador: string;
  fecha: string;
  ubicacion?: string;
};

export function useWhatsApp() {
  function buildLink(payload: WhatsAppPayload): string {
    const message = buildReceiptMessage({
      negocio: payload.negocio,
      cliente: payload.cliente,
      monto: payload.monto,
      medioPago: payload.medioPago,
      cuota: payload.cuota,
      saldo: payload.saldo,
      cobrador: payload.cobrador,
      fecha: payload.fecha,
      ubicacion: payload.ubicacion,
    });

    const encoded = encodeURIComponent(message);
    const phone = payload.telefono.replace(/[^0-9]/g, "");
    return `https://wa.me/${phone}?text=${encoded}`;
  }

  return { buildLink };
}
