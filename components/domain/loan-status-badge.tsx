import { Badge } from "@/components/ui/badge";

type LoanEstado = "activo" | "en_mora" | "saldado" | "refinanciado" | "cancelado";

const estadoMap: Record<LoanEstado, { variant: "success" | "danger" | "warning" | "primary" | "muted"; label: string }> = {
  activo: { variant: "primary", label: "Activo" },
  en_mora: { variant: "danger", label: "En mora" },
  saldado: { variant: "success", label: "Saldado" },
  refinanciado: { variant: "warning", label: "Refinanciado" },
  cancelado: { variant: "muted", label: "Cancelado" },
};

type LoanStatusBadgeProps = {
  estado: LoanEstado;
};

export function LoanStatusBadge({ estado }: LoanStatusBadgeProps) {
  const { variant, label } = estadoMap[estado] ?? { variant: "muted" as const, label: estado };
  return <Badge variant={variant}>{label}</Badge>;
}
