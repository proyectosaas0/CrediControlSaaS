import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * Represents a client/customer — matches DB columns (snake_case)
 * transformed to camelCase for frontend use.
 */
export type Cliente = {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  direccion: string;
  barrio: string;
  notas: string;
  scorePago: number;
  activo: boolean;
  createdAt: string;
};

/** Raw shape from API (Supabase snake_case) */
type ClienteRaw = {
  id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  direccion: string | null;
  barrio: string | null;
  notas: string | null;
  score_pago: number;
  activo: boolean;
  created_at: string;
};

function transformCliente(raw: ClienteRaw): Cliente {
  return {
    id: raw.id,
    nombre: raw.nombre,
    cedula: raw.cedula ?? "",
    telefono: raw.telefono ?? "",
    direccion: raw.direccion ?? "",
    barrio: raw.barrio ?? "",
    notas: raw.notas ?? "",
    scorePago: raw.score_pago,
    activo: raw.activo,
    createdAt: raw.created_at,
  };
}

/**
 * Fetches all clientes from the API.
 * Transforms snake_case DB columns → camelCase.
 */
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => apiClient.get<ClienteRaw[]>('/clientes'),
    select: (data) => data.map(transformCliente),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Fetches a single cliente by ID.
 */
export function useCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => apiClient.get<ClienteRaw>(`/clientes/${id}`),
    select: transformCliente,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    enabled: !!id,
  });
}
