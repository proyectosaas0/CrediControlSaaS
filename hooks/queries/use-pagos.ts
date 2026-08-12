import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchApi, fetchApiPaginated } from "./fetch-api";

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
  registrado_por: string;
  anulado_at: string | null;
  anulado_por: string | null;
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

const PAGOS_PAGE_SIZE = 30;

export function usePagosInfinite(params?: { prestamoId?: string }) {
  return useInfiniteQuery({
    queryKey: ["pagos", "infinite", params],
    queryFn: ({ pageParam }) =>
      fetchApiPaginated<Pago[]>("/api/pagos", {
        prestamoId: params?.prestamoId,
        page: pageParam,
        pageSize: PAGOS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length * PAGOS_PAGE_SIZE < lastPage.meta.count ? allPages.length + 1 : undefined,
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
