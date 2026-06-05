import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * Represents a payment record in the system
 * Tracks loan payments and their status
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

/**
 * Fetches all pagos from the API
 *
 * @returns Query result with pagos array or error
 * @example
 * const { data, isPending, error } = usePagos();
 * if (isPending) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * return <div>{data?.length} pagos</div>;
 */
export function usePagos() {
  return useQuery({
    queryKey: ['pagos'],
    queryFn: () => apiClient.get<Pago[]>('/pagos'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
