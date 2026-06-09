import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type CuotaRuta = {
  id: string;
  prestamo_id: string;
  organization_id: string;
  cobrador_id: string | null;
  fecha_esperada: string;
  monto_esperado: number;
  monto_pagado: number;
  estado: "pendiente" | "pagado" | "parcial" | "mora";
  numero_cuota: number;
  prestamos: {
    capital: number;
    cliente_id: string;
    clientes: {
      nombre: string;
      telefono: string | null;
      direccion: string | null;
      barrio: string | null;
    };
  };
};

export function useRutaHoy(fecha?: string, options?: { enabled?: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["ruta", fecha ?? today],
    queryFn: () =>
      fetchApi<CuotaRuta[]>("/api/ruta/hoy", {
        fecha: fecha ?? today,
      }),
    enabled: options?.enabled ?? true,
  });
}
