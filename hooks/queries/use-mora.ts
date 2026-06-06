import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type MoraRegistro = {
  id: string;
  organization_id: string;
  prestamo_id: string;
  dias_mora: number | null;
  estado: "activa" | "pagada" | "condonada";
  fecha_inicio_mora: string | null;
  monto_mora: number | null;
  monto_pagado_mora: number;
  prestamos: {
    capital: number;
    cuota_diaria: number | null;
    cliente_id: string;
    cobrador_id: string | null;
    clientes: {
      nombre: string;
      telefono: string | null;
    };
  };
};

export function useMoraList(params?: { estado?: "activa" | "pagada" | "condonada" }) {
  return useQuery({
    queryKey: ["mora", params],
    queryFn: () =>
      fetchApi<MoraRegistro[]>("/api/mora", {
        estado: params?.estado,
      }),
  });
}
