import { describe, expect, it } from "vitest";
import { calculateMora } from "@/lib/domain/mora";

describe("mora", () => {
  it("calculates percentage mora", () => {
    expect(calculateMora({ saldoVencido: 60000, tipo: "porcentaje", valor: 2, diasMora: 3 })).toBe(3600);
  });

  it("calculates fixed mora", () => {
    expect(calculateMora({ saldoVencido: 60000, tipo: "monto_fijo", valor: 1500, diasMora: 3 })).toBe(4500);
  });
});
