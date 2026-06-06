import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type Cobrador = {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  activo: boolean;
  rol: string;
};

export function useCobradores(params?: { search?: string; activo?: boolean }) {
  return useQuery({
    queryKey: ["cobradores", params],
    queryFn: () =>
      fetchApi<Cobrador[]>("/api/cobradores", {
        search: params?.search,
        activo: params?.activo,
      }),
  });
}
