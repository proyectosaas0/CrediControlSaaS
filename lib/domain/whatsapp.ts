import { formatCop } from "@/lib/domain/money";

export function buildReceiptMessage(input: {
  negocio: string;
  cliente: string;
  monto: number;
  medioPago: string;
  cuota: string;
  saldo: number;
  cobrador: string;
  fecha: string;
  ubicacion?: string;
}) {
  const parts = [
    `${input.negocio}: comprobante de pago`,
    `Cliente: ${input.cliente}`,
    `Fecha: ${input.fecha}`,
    `Monto: ${formatCop(input.monto)}`,
    `Medio: ${input.medioPago}`,
    `Cuota ${input.cuota}`,
    `Saldo restante: ${formatCop(input.saldo)}`,
    `Cobrador: ${input.cobrador}`,
  ];

  if (input.ubicacion) parts.push(`Ubicacion: ${input.ubicacion}`);

  return parts.join("\n");
}
