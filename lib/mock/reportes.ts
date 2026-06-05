// ─── MOCK DATA: Reportes ───
// TODO: Reemplazar por GET /api/reportes/*

export type MockRecaudoDiario = {
  fecha: string;
  recaudo: number;
  esperado: number;
};

export type MockCobradorRendimiento = {
  cobradorId: string;
  cobradorNombre: string;
  clientesActivos: number;
  recaudoPeriodo: number;
  esperadoPeriodo: number;
  efectividad: number;
  moraGenerada: number;
};

export type MockMedioPagoDistribucion = {
  medio: string;
  monto: number;
  porcentaje: number;
};

export type MockCarteraRiesgo = {
  categoria: string;
  clientes: number;
  monto: number;
  color: string;
};

export type MockResumenMetricas = {
  recaudoTotal: number;
  recaudoEsperado: number;
  recaudoPorcentaje: number;
  moraActiva: number;
  moraMonto: number;
  prestamosActivos: number;
  capitalActivo: number;
  efectividadCobro: number;
  clientesEnMora: number;
  clientesTotales: number;
};

export const MOCK_RECAUDO_DIARIO: MockRecaudoDiario[] = [
  { fecha: "2026-05-30", recaudo: 680_000, esperado: 720_000 },
  { fecha: "2026-05-31", recaudo: 290_000, esperado: 400_000 },
  { fecha: "2026-06-01", recaudo: 850_000, esperado: 900_000 },
  { fecha: "2026-06-02", recaudo: 620_000, esperado: 650_000 },
  { fecha: "2026-06-03", recaudo: 1_240_000, esperado: 1_240_000 },
  { fecha: "2026-06-04", recaudo: 845_000, esperado: 1_320_000 },
  { fecha: "2026-06-05", recaudo: 0, esperado: 1_100_000 },
];

export const MOCK_COBRADOR_RENDIMIENTO: MockCobradorRendimiento[] = [
  {
    cobradorId: "cb-1",
    cobradorNombre: "Juan Perez",
    clientesActivos: 7,
    recaudoPeriodo: 2_985_000,
    esperadoPeriodo: 3_300_000,
    efectividad: 90,
    moraGenerada: 120_000,
  },
  {
    cobradorId: "cb-2",
    cobradorNombre: "Ana Gomez",
    clientesActivos: 4,
    recaudoPeriodo: 1_540_000,
    esperadoPeriodo: 1_930_000,
    efectividad: 80,
    moraGenerada: 280_000,
  },
];

export const MOCK_MEDIO_PAGO_DISTRIBUCION: MockMedioPagoDistribucion[] = [
  { medio: "Efectivo", monto: 2_800_000, porcentaje: 62 },
  { medio: "Nequi", monto: 1_200_000, porcentaje: 27 },
  { medio: "Transferencia", monto: 525_000, porcentaje: 11 },
];

export const MOCK_CARTERA_RIESGO: MockCarteraRiesgo[] = [
  { categoria: "Al dia (0 dias)", clientes: 6, monto: 4_800_000, color: "#16a34a" },
  { categoria: "Leve (1-10 dias)", clientes: 2, monto: 1_200_000, color: "#ca8a04" },
  { categoria: "Moderada (11-20 dias)", clientes: 1, monto: 800_000, color: "#ea580c" },
  { categoria: "Severa (21+ dias)", clientes: 2, monto: 4_500_000, color: "#dc2626" },
];

export const MOCK_RESUMEN_METRICAS: MockResumenMetricas = {
  recaudoTotal: 4_525_000,
  recaudoEsperado: 5_230_000,
  recaudoPorcentaje: 87,
  moraActiva: 694_000,
  moraMonto: 694_000,
  prestamosActivos: 8,
  capitalActivo: 10_700_000,
  efectividadCobro: 87,
  clientesEnMora: 4,
  clientesTotales: 12,
};

export type MockProyeccion = {
  fecha: string;
  proyectado: number;
  acumulado: number;
};

export const MOCK_PROYECCION: MockProyeccion[] = [
  { fecha: "2026-06-06", proyectado: 1_050_000, acumulado: 1_050_000 },
  { fecha: "2026-06-07", proyectado: 200_000, acumulado: 1_250_000 },
  { fecha: "2026-06-08", proyectado: 1_100_000, acumulado: 2_350_000 },
  { fecha: "2026-06-09", proyectado: 1_100_000, acumulado: 3_450_000 },
  { fecha: "2026-06-10", proyectado: 1_100_000, acumulado: 4_550_000 },
  { fecha: "2026-06-11", proyectado: 1_100_000, acumulado: 5_650_000 },
  { fecha: "2026-06-12", proyectado: 550_000, acumulado: 6_200_000 },
];
