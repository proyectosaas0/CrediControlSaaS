// ─── MOCK DATA: Caja ───
// TODO: Reemplazar por GET /api/caja/resumen, /api/caja/historial

import type { MockCobrador } from "./admin";

export type MockCajaResumen = {
  totalEsperado: number;
  totalRecaudado: number;
  diferencia: number;
  cumplimiento: number;
  desgloseMedioPago: {
    efectivo: number;
    nequi: number;
    transferencia: number;
  };
};

export type MockCajaCobrador = Pick<MockCobrador, "id" | "nombre"> & {
  totalEsperado: number;
  totalRecaudado: number;
  diferencia: number;
  cumplimiento: number;
  efectivo: number;
  nequi: number;
  transferencia: number;
};

export type MockPagoRegistrado = {
  id: string;
  clienteNombre: string;
  monto: number;
  medioPago: "efectivo" | "nequi" | "transferencia";
  cobradorNombre: string;
  hora: string;
  prestamoId: string;
};

export type MockCierreCaja = {
  id: string;
  fecha: string;
  cobradorId: string;
  cobradorNombre: string;
  totalEsperado: number;
  totalRecaudado: number;
  efectivoDeclarado: number;
  diferencia: number;
  cerradoPor: string;
  tipo: "ruta" | "general";
};

export const MOCK_CAJA_RESUMEN: MockCajaResumen = {
  totalEsperado: 1_320_000,
  totalRecaudado: 845_000,
  diferencia: 475_000,
  cumplimiento: 64,
  desgloseMedioPago: {
    efectivo: 520_000,
    nequi: 225_000,
    transferencia: 100_000,
  },
};

export const MOCK_CAJA_COBRADORES: MockCajaCobrador[] = [
  {
    id: "cb-1",
    nombre: "Juan Perez",
    totalEsperado: 780_000,
    totalRecaudado: 520_000,
    diferencia: 260_000,
    cumplimiento: 67,
    efectivo: 320_000,
    nequi: 150_000,
    transferencia: 50_000,
  },
  {
    id: "cb-2",
    nombre: "Ana Gomez",
    totalEsperado: 540_000,
    totalRecaudado: 325_000,
    diferencia: 215_000,
    cumplimiento: 60,
    efectivo: 200_000,
    nequi: 75_000,
    transferencia: 50_000,
  },
];

export const MOCK_PAGOS_HOY: MockPagoRegistrado[] = [
  {
    id: "p-1",
    clienteNombre: "Maria Garcia",
    monto: 55_000,
    medioPago: "efectivo",
    cobradorNombre: "Juan Perez",
    hora: "08:15",
    prestamoId: "pr-1",
  },
  {
    id: "p-2",
    clienteNombre: "Carlos Perez",
    monto: 45_000,
    medioPago: "nequi",
    cobradorNombre: "Juan Perez",
    hora: "08:45",
    prestamoId: "pr-2",
  },
  {
    id: "p-3",
    clienteNombre: "Ana Rodriguez",
    monto: 73_333,
    medioPago: "efectivo",
    cobradorNombre: "Juan Perez",
    hora: "09:30",
    prestamoId: "pr-3",
  },
  {
    id: "p-4",
    clienteNombre: "Jose Martinez",
    monto: 50_000,
    medioPago: "transferencia",
    cobradorNombre: "Ana Gomez",
    hora: "09:50",
    prestamoId: "pr-4",
  },
  {
    id: "p-5",
    clienteNombre: "Pedro Sanchez",
    monto: 55_000,
    medioPago: "efectivo",
    cobradorNombre: "Juan Perez",
    hora: "10:20",
    prestamoId: "pr-6",
  },
  {
    id: "p-6",
    clienteNombre: "Diana Lopez",
    monto: 39_600,
    medioPago: "nequi",
    cobradorNombre: "Ana Gomez",
    hora: "11:00",
    prestamoId: "pr-7",
  },
  {
    id: "p-7",
    clienteNombre: "Roberto Diaz",
    monto: 99_000,
    medioPago: "efectivo",
    cobradorNombre: "Juan Perez",
    hora: "11:30",
    prestamoId: "pr-8",
  },
];

export const MOCK_CIERRES_CAJA: MockCierreCaja[] = [
  {
    id: "ci-1",
    fecha: "2026-06-04",
    cobradorId: "cb-1",
    cobradorNombre: "Juan Perez",
    totalEsperado: 780_000,
    totalRecaudado: 780_000,
    efectivoDeclarado: 780_000,
    diferencia: 0,
    cerradoPor: "admin",
    tipo: "ruta",
  },
  {
    id: "ci-2",
    fecha: "2026-06-04",
    cobradorId: "cb-2",
    cobradorNombre: "Ana Gomez",
    totalEsperado: 540_000,
    totalRecaudado: 520_000,
    efectivoDeclarado: 520_000,
    diferencia: 20_000,
    cerradoPor: "cobrador",
    tipo: "ruta",
  },
  {
    id: "ci-3",
    fecha: "2026-06-04",
    cobradorId: "cb-1",
    cobradorNombre: "Todos",
    totalEsperado: 1_320_000,
    totalRecaudado: 1_300_000,
    efectivoDeclarado: 1_300_000,
    diferencia: 20_000,
    cerradoPor: "admin",
    tipo: "general",
  },
  {
    id: "ci-4",
    fecha: "2026-06-03",
    cobradorId: "cb-1",
    cobradorNombre: "Juan Perez",
    totalEsperado: 750_000,
    totalRecaudado: 750_000,
    efectivoDeclarado: 750_000,
    diferencia: 0,
    cerradoPor: "admin",
    tipo: "ruta",
  },
  {
    id: "ci-5",
    fecha: "2026-06-03",
    cobradorId: "cb-2",
    cobradorNombre: "Ana Gomez",
    totalEsperado: 500_000,
    totalRecaudado: 490_000,
    efectivoDeclarado: 490_000,
    diferencia: 10_000,
    cerradoPor: "cobrador",
    tipo: "ruta",
  },
];
