import { Banknote, Smartphone, Building2, type LucideIcon } from "lucide-react";

export type MedioPago = "efectivo" | "nequi" | "transferencia";

export const MEDIOS_PAGO: { value: MedioPago; label: string; icon: LucideIcon }[] = [
  { value: "efectivo", label: "Efectivo", icon: Banknote },
  { value: "nequi", label: "Nequi", icon: Smartphone },
  { value: "transferencia", label: "Transfer.", icon: Building2 },
];
