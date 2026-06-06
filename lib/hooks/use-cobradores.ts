import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * Represents a loan collector/agent in the system.
 */
export type Cobrador = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  activo: boolean;
  comision: number;
};

/** Raw shape from API */
type CobradorRaw = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  activo: boolean;
  comision: number;
};

function transformCobrador(raw: CobradorRaw): Cobrador {
  return {
    id: raw.id,
    nombre: raw.nombre,
    telefono: raw.telefono,
    email: raw.email,
    activo: raw.activo,
    comision: raw.comision,
  };
}

/**
 * Fetches all cobradores from the API.
 */
export function useCobradores() {
  return useQuery({
    queryKey: ['cobradores'],
    queryFn: () => apiClient.get<CobradorRaw[]>('/cobradores'),
    select: (data) => data.map(transformCobrador),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
