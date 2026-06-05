import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * Represents a loan in the system
 * Contains information about principal, payment schedule, and borrower
 */
export type Prestamo = {
  id: string;
  clienteNombre: string;
  capital: number;
  cuotaDiaria: number;
  totalPagar: number;
  cuotasPagadas: number;
  cuotasTotales: number;
  estado: 'activo' | 'en_mora' | 'saldado' | 'refinanciado' | 'cancelado';
  cobradorNombre?: string;
};

/**
 * Fetches all prestamos from the API
 *
 * @returns Query result with prestamos array or error
 * @example
 * const { data, isPending, error } = usePrestamos();
 * if (isPending) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * return <div>{data?.length} prestamos</div>;
 */
export function usePrestamos() {
  return useQuery({
    queryKey: ['prestamos'],
    queryFn: () => apiClient.get<Prestamo[]>('/prestamos'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
