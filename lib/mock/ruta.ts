// ─── LEGACY TYPES — Kept for backwards compatibility ───
// Types needed by other modules but no longer actively used for mocks

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

export const MOCK_NEGOCIO = "Cobros del Valle";
export const MOCK_COBRADOR = "Juan Perez";
