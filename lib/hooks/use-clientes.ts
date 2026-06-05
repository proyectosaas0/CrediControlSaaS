import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export type Cliente = {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  barrio?: string;
  activo: boolean;
  scorePago: number;
};

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => apiClient.get<Cliente[]>('/clientes'),
  });
}
