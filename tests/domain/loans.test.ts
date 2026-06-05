import { describe, expect, it } from "vitest";
import { buildLoanSchedule, calculateLoanTotals } from "@/lib/domain/loans";

describe("loan calculations", () => {
  it("calculates cuota fija", () => {
    expect(calculateLoanTotals({ capital: 500000, tasaMensual: 20, plazoDias: 10, modelo: "cuota_fija" })).toEqual({
      totalPagar: 600000,
      cuotaDiaria: 60000,
    });
  });

  it("calculates solo interes", () => {
    expect(calculateLoanTotals({ capital: 1000000, tasaMensual: 10, plazoDias: 30, modelo: "solo_interes" })).toEqual({
      totalPagar: 1100000,
      cuotaDiaria: 3333.33,
    });
  });

  it("skips weekends when requested", () => {
    const schedule = buildLoanSchedule({
      capital: 500000,
      tasaMensual: 20,
      plazoDias: 3,
      modelo: "cuota_fija",
      fechaInicio: "2026-06-05",
      excluirSabados: true,
      excluirDomingos: true,
    });

    expect(schedule.map((q) => q.fechaEsperada)).toEqual(["2026-06-05", "2026-06-08", "2026-06-09"]);
    expect(schedule.reduce((sum, q) => sum + q.montoEsperado, 0)).toBe(600000);
  });
});
