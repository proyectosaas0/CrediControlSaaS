import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * Represents a client/customer in the system
 * Used for tracking payment scores and customer information
 */
export type Cliente = {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  barrio?: string;
  activo: boolean;
  scorePago: number;
};

/**
 * Fetches all clientes from the API
 *
 * @returns Query result with clientes array or error
 * @example
 * const { data, isPending, error } = useClientes();
 * if (isPending) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * return <div>{data?.length} clientes</div>;
 */
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => apiClient.get<Cliente[]>('/clientes'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
