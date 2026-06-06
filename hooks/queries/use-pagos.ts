import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type Pago = {
  id: string;
  monto: number;
  medio_pago: string;
  tipo: string;
  nota: string | null;
  created_at: string;
  prestamo_id: string;
  cliente_id: string;
  cobrador_id: string;
  clientes: { nombre: string } | null;
};

export function usePagos(params?: { prestamoId?: string; page?: number }) {
  return useQuery({
    queryKey: ["pagos", params],
    queryFn: () =>
      fetchApi<Pago[]>("/api/pagos", {
        prestamoId: params?.prestamoId,
        page: params?.page,
      }),
  });
}
