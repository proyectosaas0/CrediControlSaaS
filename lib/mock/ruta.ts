// ─── MOCK DATA — Fase 2 ───
// TODO: Reemplazar por GET /api/ruta/hoy cuando el backend esté listo.
// Todos los datos aquí son ficticios y solo existen en el cliente.

import type { MedioPago } from "./ruta-types";

export type RouteItemStatus =
  | "pendiente"
  | "pagado"
  | "parcial"
  | "mora"
  | "no_encontrado";

export type RouteItem = {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  barrio: string;
  direccion: string;
  montoEsperado: number;
  montoPagado: number | null;
  medioPago: MedioPago | null;
  cuotaNumero: number;
  cuotaTotal: number;
  saldoPendiente: number;
  estado: RouteItemStatus;
};

export type DailySummary = {
  totalCobros: number;
  cobrosPendientes: number;
  cobrosRealizados: number;
  totalEsperado: number;
  totalRecaudado: number;
};

export type PagoRecord = {
  id: string;
  clienteNombre: string;
  monto: number;
  medioPago: MedioPago;
  cuota: string;
  fecha: string;
};

const NOW = new Date();
const TODAY_STR = NOW.toLocaleDateString("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "long",
});

export const MOCK_DAILY_SUMMARY: DailySummary = {
  totalCobros: 12,
  cobrosPendientes: 8,
  cobrosRealizados: 4,
  totalEsperado: 720_000,
  totalRecaudado: 245_000,
};

export const MOCK_ROUTE_ITEMS: RouteItem[] = [
  {
    id: "r-1",
    clienteId: "c-1",
    clienteNombre: "Maria Garcia",
    clienteTelefono: "+573001111111",
    barrio: "Barrio Centro",
    direccion: "Cra 5 #10-20",
    montoEsperado: 60_000,
    montoPagado: null,
    medioPago: null,
    cuotaNumero: 8,
    cuotaTotal: 30,
    saldoPendiente: 1_320_000,
    estado: "pendiente",
  },
  {
    id: "r-2",
    clienteId: "c-2",
    clienteNombre: "Carlos Perez",
    clienteTelefono: "+573002222222",
    barrio: "Barrio Norte",
    direccion: "Cl 12 #8-45",
    montoEsperado: 45_000,
    montoPagado: 45_000,
    medioPago: "efectivo",
    cuotaNumero: 12,
    cuotaTotal: 20,
    saldoPendiente: 360_000,
    estado: "pagado",
  },
  {
    id: "r-3",
    clienteId: "c-3",
    clienteNombre: "Ana Rodriguez",
    clienteTelefono: "+573003333333",
    barrio: "Barrio Sur",
    direccion: "Diag 18 #3-60",
    montoEsperado: 60_000,
    montoPagado: null,
    medioPago: null,
    cuotaNumero: 3,
    cuotaTotal: 15,
    saldoPendiente: 720_000,
    estado: "pendiente",
  },
  {
    id: "r-4",
    clienteId: "c-4",
    clienteNombre: "Jose Martinez",
    clienteTelefono: "+573004444444",
    barrio: "Barrio Occidente",
    direccion: "Cra 15 #22-10",
    montoEsperado: 50_000,
    montoPagado: 25_000,
    medioPago: "nequi",
    cuotaNumero: 10,
    cuotaTotal: 25,
    saldoPendiente: 750_000,
    estado: "parcial",
  },
  {
    id: "r-5",
    clienteId: "c-5",
    clienteNombre: "Luisa Fernandez",
    clienteTelefono: "+573005555555",
    barrio: "Barrio Oriental",
    direccion: "Cl 8 #30-15",
    montoEsperado: 80_000,
    montoPagado: null,
    medioPago: null,
    cuotaNumero: 18,
    cuotaTotal: 30,
    saldoPendiente: 960_000,
    estado: "mora",
  },
  {
    id: "r-6",
    clienteId: "c-6",
    clienteNombre: "Pedro Sanchez",
    clienteTelefono: "+573006666666",
    barrio: "Barrio Laureles",
    direccion: "Cra 42 #9-12",
    montoEsperado: 55_000,
    montoPagado: 55_000,
    medioPago: "transferencia",
    cuotaNumero: 5,
    cuotaTotal: 20,
    saldoPendiente: 825_000,
    estado: "pagado",
  },
  {
    id: "r-7",
    clienteId: "c-7",
    clienteNombre: "Diana Lopez",
    clienteTelefono: "+573007777777",
    barrio: "Barrio Boston",
    direccion: "Cl 50 #28-7",
    montoEsperado: 40_000,
    montoPagado: 40_000,
    medioPago: "efectivo",
    cuotaNumero: 14,
    cuotaTotal: 25,
    saldoPendiente: 440_000,
    estado: "pagado",
  },
  {
    id: "r-8",
    clienteId: "c-8",
    clienteNombre: "Roberto Diaz",
    clienteTelefono: "+573008888888",
    barrio: "Barrio Conquistadores",
    direccion: "Diag 74A #45-22",
    montoEsperado: 65_000,
    montoPagado: null,
    medioPago: null,
    cuotaNumero: 6,
    cuotaTotal: 20,
    saldoPendiente: 910_000,
    estado: "pendiente",
  },
  {
    id: "r-9",
    clienteId: "c-9",
    clienteNombre: "Carolina Morales",
    clienteTelefono: "+573009999999",
    barrio: "Barrio Villa Hermosa",
    direccion: "Cra 28 #55-40",
    montoEsperado: 70_000,
    montoPagado: null,
    medioPago: null,
    cuotaNumero: 22,
    cuotaTotal: 30,
    saldoPendiente: 560_000,
    estado: "pendiente",
  },
  {
    id: "r-10",
    clienteId: "c-10",
    clienteNombre: "Fernando Castillo",
    clienteTelefono: "+573001000000",
    barrio: "Barrio Manrique",
    direccion: "Cl 70 #38-19",
    montoEsperado: 55_000,
    montoPagado: 55_000,
    medioPago: "efectivo",
    cuotaNumero: 9,
    cuotaTotal: 15,
    saldoPendiente: 330_000,
    estado: "pagado",
  },
  {
    id: "r-11",
    clienteId: "c-11",
    clienteNombre: "Sandra Ramirez",
    clienteTelefono: "+573001111100",
    barrio: "Barrio Aranjuez",
    direccion: "Cra 52 #64-30",
    montoEsperado: 45_000,
    montoPagado: null,
    medioPago: null,
    cuotaNumero: 4,
    cuotaTotal: 20,
    saldoPendiente: 720_000,
    estado: "pendiente",
  },
  {
    id: "r-12",
    clienteId: "c-12",
    clienteNombre: "Andres Torres",
    clienteTelefono: "+573001222200",
    barrio: "Barrio Robledo",
    direccion: "Diag 90A #60-45",
    montoEsperado: 95_000,
    montoPagado: null,
    medioPago: null,
    cuotaNumero: 15,
    cuotaTotal: 30,
    saldoPendiente: 1_425_000,
    estado: "no_encontrado",
  },
];

export const MOCK_PAGOS_HOY: PagoRecord[] = [
  {
    id: "p-1",
    clienteNombre: "Carlos Perez",
    monto: 45_000,
    medioPago: "efectivo",
    cuota: "12/20",
    fecha: `${TODAY_STR} 08:15 AM`,
  },
  {
    id: "p-2",
    clienteNombre: "Pedro Sanchez",
    monto: 55_000,
    medioPago: "transferencia",
    cuota: "5/20",
    fecha: `${TODAY_STR} 09:32 AM`,
  },
  {
    id: "p-3",
    clienteNombre: "Diana Lopez",
    monto: 40_000,
    medioPago: "efectivo",
    cuota: "14/25",
    fecha: `${TODAY_STR} 10:47 AM`,
  },
  {
    id: "p-4",
    clienteNombre: "Fernando Castillo",
    monto: 55_000,
    medioPago: "efectivo",
    cuota: "9/15",
    fecha: `${TODAY_STR} 11:20 AM`,
  },
  {
    id: "p-5",
    clienteNombre: "Jose Martinez",
    monto: 25_000,
    medioPago: "nequi",
    cuota: "10/25",
    fecha: `${TODAY_STR} 12:05 PM`,
  },
];

export const MOCK_NEGOCIO = "Cobros del Valle";
export const MOCK_COBRADOR = "Juan Perez";
