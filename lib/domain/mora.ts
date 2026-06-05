import { roundMoney } from "@/lib/domain/money";

export function calculateMora(input: {
  saldoVencido: number;
  tipo: "porcentaje" | "monto_fijo";
  valor: number;
  diasMora: number;
}) {
  if (input.diasMora <= 0) return 0;
  if (input.tipo === "monto_fijo") return roundMoney(input.valor * input.diasMora);
  return roundMoney(input.saldoVencido * (input.valor / 100) * input.diasMora);
}
