import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type CajaResumen = {
  fecha: string;
  totalEsperado: number;
  totalRecaudado: number;
  diferencia: number;
  breakdown: Record<string, number>;
};

export function useCajaResumen(fecha?: string) {
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["caja", "resumen", fecha ?? today],
    queryFn: () =>
      fetchApi<CajaResumen>("/api/caja/resumen", {
        fecha: fecha ?? today,
      }),
  });
}
