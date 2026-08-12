import { formatCop } from "@/lib/domain/money";
import type { ReceiptData } from "@/lib/domain/receipt-canvas";

const TIPO_LABELS: Record<string, string> = {
  abono: "Abono",
  cuota: "Cuota regular",
  liquidacion: "Liquidación",
  mora: "Pago de mora",
  parcial: "Pago parcial",
  vencida: "Cuota vencida",
};

export function buildPagoReceiptData(input: {
  negocio: string;
  cliente: string;
  cobrador: string;
  monto: number;
  medioPago: string;
  tipo: string;
  cuota: number | null;
  saldo: number | null;
  fecha: string;
}): ReceiptData {
  return {
    negocio: input.negocio,
    titulo: "Comprobante de pago",
    subtitulo: input.fecha,
    sections: [
      {
        rows: [
          { label: "Cliente", value: input.cliente },
          { label: "Monto pagado", value: formatCop(input.monto), accent: "success" },
          { label: "Medio de pago", value: input.medioPago },
          { label: "Tipo", value: TIPO_LABELS[input.tipo] ?? input.tipo },
          ...(input.cuota ? [{ label: "Cuota", value: `N° ${input.cuota}` }] : []),
          ...(input.saldo !== null
            ? [{ label: "Saldo pendiente del préstamo", value: formatCop(input.saldo) }]
            : []),
          { label: "Cobrador", value: input.cobrador },
        ],
      },
    ],
  };
}

export function buildPrestamoSummaryData(input: {
  negocio: string;
  cliente: string;
  capital: number;
  tasaMensual: number;
  plazoDias: number;
  cuotasPagadas: number;
  cuotasTotales: number;
  saldoPendiente: number;
  estado: string;
  motivoCancelacion?: string | null;
  proximaCuota?: { fecha: string; monto: number } | null;
}): ReceiptData {
  const estadoLabels: Record<string, string> = {
    activo: "Activo",
    cancelado: "Cancelado",
    en_mora: "En mora",
    refinanciado: "Refinanciado",
    saldado: "Saldado",
  };
  const estadoAccent = input.estado === "saldado" ? "success" : input.estado === "en_mora" || input.estado === "cancelado" ? "danger" : "default";

  return {
    negocio: input.negocio,
    titulo: "Resumen del préstamo",
    subtitulo: input.cliente,
    sections: [
      {
        heading: "Préstamo",
        rows: [
          { label: "Cliente", value: input.cliente },
          { label: "Capital", value: formatCop(input.capital) },
          { label: "Tasa mensual", value: `${input.tasaMensual}%` },
          { label: "Plazo", value: `${input.plazoDias} días` },
          { label: "Estado", value: estadoLabels[input.estado] ?? input.estado, accent: estadoAccent },
          ...(input.estado === "cancelado" && input.motivoCancelacion
            ? [{ label: "Motivo de cancelación", value: input.motivoCancelacion }]
            : []),
        ],
      },
      {
        heading: "Saldo",
        rows: [
          {
            label: "Cuotas pagadas",
            value: `${input.cuotasPagadas} / ${input.cuotasTotales}`,
          },
          { label: "Saldo pendiente", value: formatCop(input.saldoPendiente), accent: "warning" },
          ...(input.proximaCuota
            ? [
                {
                  label: "Próxima cuota",
                  value: `${formatCop(input.proximaCuota.monto)} · ${new Date(input.proximaCuota.fecha).toLocaleDateString("es-CO")}`,
                },
              ]
            : []),
        ],
      },
    ],
  };
}
