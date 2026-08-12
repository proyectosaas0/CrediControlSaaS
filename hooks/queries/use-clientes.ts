import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchApi, fetchApiPaginated } from "./fetch-api";

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
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["clientes", params],
    queryFn: () =>
      fetchApi<Cliente[]>("/api/clientes", {
        search: params?.search,
        activo: params?.activo,
        page: params?.page,
        pageSize: params?.pageSize,
      }),
  });
}

const CLIENTES_PAGE_SIZE = 30;

export function useClientesInfinite(params?: { search?: string; activo?: boolean }) {
  return useInfiniteQuery({
    queryKey: ["clientes", "infinite", params],
    queryFn: ({ pageParam }) =>
      fetchApiPaginated<Cliente[]>("/api/clientes", {
        search: params?.search,
        activo: params?.activo,
        page: pageParam,
        pageSize: CLIENTES_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length * CLIENTES_PAGE_SIZE < lastPage.meta.count ? allPages.length + 1 : undefined,
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ["clientes", id],
    queryFn: () => fetchApi<Cliente>(`/api/clientes/${id}`),
    enabled: !!id,
  });
}
