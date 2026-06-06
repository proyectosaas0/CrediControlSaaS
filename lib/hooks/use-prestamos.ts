import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * Represents a loan in the system.
 * Expanded to include all fields needed by detail/list pages.
 */
export type Prestamo = {
  id: string;
  clienteId: string;
  clienteNombre: string;
  capital: number;
  modeloInteres: string;
  tasaMensual: number;
  plazoDias: number;
  cuotaDiaria: number;
  totalPagar: number;
  fechaInicio: string;
  fechaFin: string;
  estado: 'activo' | 'en_mora' | 'saldado' | 'refinanciado' | 'cancelado';
  cuotasPagadas: number;
  cuotasTotales: number;
  saldoPendiente: number;
  cobradorId: string | null;
  cobradorNombre: string | null;
};

/** Raw shape from API — prestamos row + nested prestamo_saldos */
type PrestamoRaw = {
  id: string;
  cliente_id: string;
  cobrador_id: string | null;
  capital: number;
  modelo_interes: string;
  tasa_mensual: number;
  plazo_dias: number;
  cuota_diaria: number;
  total_pagar: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  cuotas_pagadas: number;
  cuotas_totales: number;
  // Mock-fallback fields from dev API
  cliente_nombre?: string;
  cobrador_nombre?: string | null;
  // Join: prestamo_saldos (may be array or single)
  prestamo_saldos?: Array<{ saldo_pendiente: number }> | { saldo_pendiente: number };
};

function transformPrestamo(raw: PrestamoRaw): Prestamo {
  let saldoPendiente = 0;
  if (raw.prestamo_saldos) {
    const saldos = Array.isArray(raw.prestamo_saldos)
      ? raw.prestamo_saldos
      : [raw.prestamo_saldos];
    saldoPendiente = saldos.reduce((sum, s) => sum + (s.saldo_pendiente ?? 0), 0);
  }
  return {
    id: raw.id,
    clienteId: raw.cliente_id,
    clienteNombre: raw.cliente_nombre ?? "Desconocido",
    capital: raw.capital,
    modeloInteres: raw.modelo_interes,
    tasaMensual: raw.tasa_mensual,
    plazoDias: raw.plazo_dias,
    cuotaDiaria: raw.cuota_diaria,
    totalPagar: raw.total_pagar,
    fechaInicio: raw.fecha_inicio,
    fechaFin: raw.fecha_fin,
    estado: raw.estado as Prestamo['estado'],
    cuotasPagadas: raw.cuotas_pagadas,
    cuotasTotales: raw.cuotas_totales,
    saldoPendiente,
    cobradorId: raw.cobrador_id,
    cobradorNombre: raw.cobrador_nombre ?? null,
  };
}

/**
 * Fetches all prestamos from the API.
 * Transforms snake_case + nested join → camelCase.
 */
export function usePrestamos() {
  return useQuery({
    queryKey: ['prestamos'],
    queryFn: () => apiClient.get<PrestamoRaw[]>('/prestamos'),
    select: (data) => data.map(transformPrestamo),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Fetches a single prestamo by ID.
 */
export function usePrestamo(id: string) {
  return useQuery({
    queryKey: ['prestamos', id],
    queryFn: () => apiClient.get<PrestamoRaw>(`/prestamos/${id}`),
    select: transformPrestamo,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    enabled: !!id,
  });
}
