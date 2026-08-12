import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchApi, fetchApiPaginated } from "./fetch-api";

export type PrestamoSaldo = {
  id: string;
  prestamo_id: string;
  cuotas_pagadas: number;
  cuotas_totales: number;
  saldo_pendiente: number;
};

export type Prestamo = {
  id: string;
  organization_id: string;
  cliente_id: string;
  cobrador_id: string | null;
  estado: "activo" | "en_mora" | "saldado" | "refinanciado" | "cancelado";
  capital: number;
  cuota_diaria: number | null;
  total_pagar: number | null;
  plazo_dias: number;
  modelo_interes: "cuota_fija" | "solo_interes" | "sobre_saldo";
  tasa_mensual: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  excluir_sabados: boolean;
  excluir_domingos: boolean;
  created_at: string;
  motivo_cancelacion: string | null;
  cancelado_at: string | null;
  dia_cobro: string[] | null;
  clientes: { nombre: string } | null;
  prestamo_saldos: PrestamoSaldo[] | null;
};

export function usePrestamos(params?: {
  estado?: string;
  page?: number;
  pageSize?: number;
  clienteId?: string;
  cobradorId?: string;
}) {
  return useQuery({
    queryKey: ["prestamos", params],
    queryFn: () =>
      fetchApi<Prestamo[]>("/api/prestamos", {
        estado: params?.estado,
        page: params?.page,
        pageSize: params?.pageSize,
        cliente_id: params?.clienteId,
        cobrador_id: params?.cobradorId,
      }),
  });
}

const PRESTAMOS_PAGE_SIZE = 30;

export function usePrestamosInfinite(params?: { estado?: string }) {
  return useInfiniteQuery({
    queryKey: ["prestamos", "infinite", params],
    queryFn: ({ pageParam }) =>
      fetchApiPaginated<Prestamo[]>("/api/prestamos", {
        estado: params?.estado,
        page: pageParam,
        pageSize: PRESTAMOS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length * PRESTAMOS_PAGE_SIZE < lastPage.meta.count ? allPages.length + 1 : undefined,
  });
}

export function usePrestamo(id: string) {
  return useQuery({
    queryKey: ["prestamos", id],
    queryFn: () => fetchApi<Prestamo>(`/api/prestamos/${id}`),
    enabled: !!id,
  });
}
