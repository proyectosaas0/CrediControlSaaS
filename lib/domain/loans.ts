import { roundMoney } from "@/lib/domain/money";

export type LoanModel = "cuota_fija" | "solo_interes" | "sobre_saldo";

export type LoanInput = {
  capital: number;
  tasaMensual: number;
  plazoDias: number;
  modelo: LoanModel;
};

export type ScheduleInput = LoanInput & {
  fechaInicio: string;
  excluirSabados: boolean;
  excluirDomingos: boolean;
};

export type ScheduleItem = {
  numeroCuota: number;
  fechaEsperada: string;
  montoEsperado: number;
  montoCapital: number;
  montoInteres: number;
  saldoEstimado: number;
};

export function calculateLoanTotals(input: LoanInput) {
  if (input.modelo === "solo_interes") {
    const interesTotal = roundMoney(input.capital * (input.tasaMensual / 100));
    return {
      cuotaDiaria: roundMoney(interesTotal / input.plazoDias),
      totalPagar: roundMoney(input.capital + interesTotal),
    };
  }

  const totalPagar = roundMoney(input.capital + input.capital * (input.tasaMensual / 100));
  return { cuotaDiaria: roundMoney(totalPagar / input.plazoDias), totalPagar };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isSkipped(date: Date, excluirSabados: boolean, excluirDomingos: boolean) {
  const day = date.getUTCDay();
  return (day === 6 && excluirSabados) || (day === 0 && excluirDomingos);
}

export function buildLoanSchedule(input: ScheduleInput): ScheduleItem[] {
  const dates: string[] = [];
  let cursor = new Date(`${input.fechaInicio}T00:00:00.000Z`);

  while (dates.length < input.plazoDias) {
    if (!isSkipped(cursor, input.excluirSabados, input.excluirDomingos)) {
      dates.push(toIsoDate(cursor));
    }
    cursor = addDays(cursor, 1);
  }

  const { totalPagar, cuotaDiaria } = calculateLoanTotals(input);
  const interesTotal = roundMoney(totalPagar - input.capital);
  const capitalDiario = roundMoney(input.capital / input.plazoDias);
  const interesDiario = roundMoney(interesTotal / input.plazoDias);

  let accumulated = 0;
  let accumulatedCapital = 0;
  let accumulatedInteres = 0;
  let saldo = totalPagar;

  return dates.map((fechaEsperada, index) => {
    const remainingSlots = dates.length - index;
    const isLast = remainingSlots === 1;
    const montoEsperado = isLast ? roundMoney(totalPagar - accumulated) : cuotaDiaria;
    accumulated = roundMoney(accumulated + montoEsperado);
    saldo = roundMoney(saldo - montoEsperado);

    let montoCapital: number;
    let montoInteres: number;
    if (input.modelo === "solo_interes") {
      // Interest-only until the last day, which also carries the full capital.
      montoCapital = remainingSlots > 1 ? 0 : roundMoney(Math.min(input.capital, montoEsperado));
      montoInteres = roundMoney(Math.max(0, montoEsperado - montoCapital));
    } else {
      // cuota_fija / sobre_saldo: each daily cuota carries a proportional
      // slice of both capital and interest; the last day absorbs rounding
      // drift so the totals reconcile exactly with the loan's capital/interes.
      montoCapital = isLast ? roundMoney(input.capital - accumulatedCapital) : capitalDiario;
      montoInteres = isLast ? roundMoney(interesTotal - accumulatedInteres) : interesDiario;
    }
    accumulatedCapital = roundMoney(accumulatedCapital + montoCapital);
    accumulatedInteres = roundMoney(accumulatedInteres + montoInteres);

    return {
      fechaEsperada,
      montoCapital,
      montoEsperado,
      montoInteres,
      numeroCuota: index + 1,
      saldoEstimado: saldo,
    };
  });
}
