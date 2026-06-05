import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * Represents a loan collector/agent in the system
 * Tracks collectors managing loan payments and client relationships
 */
export type Cobrador = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  activo: boolean;
  comision: number;
};

/**
 * Fetches all cobradores from the API
 *
 * @returns Query result with cobradores array or error
 * @example
 * const { data, isPending, error } = useCobradores();
 * if (isPending) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * return <div>{data?.length} cobradores</div>;
 */
export function useCobradores() {
  return useQuery({
    queryKey: ['cobradores'],
    queryFn: () => apiClient.get<Cobrador[]>('/cobradores'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
