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

  it("splits capital and interes on every cuota for cuota_fija, reconciling with the loan totals", () => {
    const schedule = buildLoanSchedule({
      capital: 80000,
      tasaMensual: 20,
      plazoDias: 5,
      modelo: "cuota_fija",
      fechaInicio: "2026-06-05",
      excluirSabados: false,
      excluirDomingos: false,
    });

    for (const cuota of schedule) {
      expect(cuota.montoInteres).toBeGreaterThan(0);
      expect(cuota.montoCapital + cuota.montoInteres).toBeCloseTo(cuota.montoEsperado, 2);
    }
    expect(schedule.reduce((sum, q) => sum + q.montoCapital, 0)).toBeCloseTo(80000, 2);
    expect(schedule.reduce((sum, q) => sum + q.montoInteres, 0)).toBeCloseTo(16000, 2);
  });

  it("keeps solo_interes cuotas interest-only until the final balloon capital payment", () => {
    const schedule = buildLoanSchedule({
      capital: 1000000,
      tasaMensual: 10,
      plazoDias: 3,
      modelo: "solo_interes",
      fechaInicio: "2026-06-05",
      excluirSabados: false,
      excluirDomingos: false,
    });

    expect(schedule[0].montoCapital).toBe(0);
    expect(schedule[1].montoCapital).toBe(0);
    expect(schedule[2].montoCapital).toBeCloseTo(1000000, 2);
  });
});
