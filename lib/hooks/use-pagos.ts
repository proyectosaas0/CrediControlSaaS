import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * Represents a payment record in the system.
 */
export type Pago = {
  id: string;
  prestamoId: string;
  clienteNombre: string;
  monto: number;
  fecha: string;
  concepto: string;
  estado: 'procesando' | 'completado' | 'rechazado';
  metodo?: string;
};

/** Raw shape from API */
type PagoRaw = {
  id: string;
  prestamo_id?: string;
  prestamoId?: string;
  cliente_nombre?: string;
  clienteNombre?: string;
  monto: number;
  fecha: string;
  concepto?: string;
  estado: string;
  metodo?: string;
  medio_pago?: string;
};

function transformPago(raw: PagoRaw): Pago {
  return {
    id: raw.id,
    prestamoId: raw.prestamo_id ?? raw.prestamoId ?? "",
    clienteNombre: raw.cliente_nombre ?? raw.clienteNombre ?? "Desconocido",
    monto: raw.monto,
    fecha: raw.fecha,
    concepto: raw.concepto ?? "",
    estado: raw.estado as Pago['estado'],
    metodo: raw.metodo ?? raw.medio_pago,
  };
}

/**
 * Fetches all pagos from the API.
 */
export function usePagos() {
  return useQuery({
    queryKey: ['pagos'],
    queryFn: () => apiClient.get<PagoRaw[]>('/pagos'),
    select: (data) => data.map(transformPago),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
