import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type Cliente = {
  id: string;
  organization_id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  direccion: string | null;
  barrio: string | null;
  notas: string | null;
  score_pago: number;
  activo: boolean;
  created_at: string;
  prestamos_count?: number;
};

export function useClientes(params?: {
  search?: string;
  activo?: boolean;
  page?: number;
}) {
  return useQuery({
    queryKey: ["clientes", params],
    queryFn: () =>
      fetchApi<Cliente[]>("/api/clientes", {
        search: params?.search,
        activo: params?.activo,
        page: params?.page,
      }),
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ["clientes", id],
    queryFn: () => fetchApi<Cliente>(`/api/clientes/${id}`),
    enabled: !!id,
  });
}
