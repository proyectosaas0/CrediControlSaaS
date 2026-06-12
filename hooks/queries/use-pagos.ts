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

export type PagoDetail = Pago & {
  cronograma_pago_id: string | null;
  lat: number | null;
  lng: number | null;
  cobrador_nombre: string | null;
  prestamo: {
    capital: number;
    modelo_interes: string;
    tasa_mensual: number;
  } | null;
  cuota: {
    numero_cuota: number;
    monto_esperado: number;
  } | null;
};

export type CuotaCronograma = {
  id: string;
  numero_cuota: number;
  fecha_esperada: string;
  monto_esperado: number;
  estado: "pendiente" | "pagado" | "parcial" | "vencido" | "cancelado";
  monto_pagado: number;
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

export function usePago(id: string) {
  return useQuery({
    queryKey: ["pagos", id],
    queryFn: () => fetchApi<PagoDetail>(`/api/pagos/${id}`),
    enabled: !!id,
  });
}

export function useCronogramaPrestamo(prestamoId: string | null) {
  return useQuery({
    queryKey: ["cronograma", prestamoId],
    queryFn: () => fetchApi<CuotaCronograma[]>(`/api/prestamos/${prestamoId}/cronograma`),
    enabled: !!prestamoId,
  });
}
