export type MedioPago = "efectivo" | "nequi" | "transferencia";

export const MEDIOS_PAGO: { value: MedioPago; label: string; icon: string }[] = [
  { value: "efectivo", label: "Efectivo", icon: "💵" },
  { value: "nequi", label: "Nequi", icon: "📱" },
  { value: "transferencia", label: "Transfer.", icon: "🏦" },
];
