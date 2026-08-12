import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type ReportesResumen = {
  desde: string;
  hasta: string;
  prestamosActivos: number;
  prestamosEnMora: number;
  recaudoTotal: number;
  capitalPendiente: number;
  interesPendiente: number;
  totalPendiente: number;
};

export type RecaudoDiario = {
  fecha: string;
  recaudado: number;
  esperado: number;
};

export type ReportesCobrador = {
  // groupSum() names the grouping key "name" generically; here it's actually
  // the cobrador_id (pagos.cobrador_id) — look up the display name separately.
  name: string;
  total: number;
};

export type CarteraRiesgo = {
  mayorA3: number;
  mayorA7: number;
  mayorA15: number;
  montoTotal: number;
};

export type Proyeccion = {
  dias: number;
  total: number;
};

type RangoParams = { desde?: string; hasta?: string };

function todayRange(): RangoParams {
  const today = new Date().toISOString().slice(0, 10);
  return { desde: today, hasta: today };
}

export function useReportesResumen(rango?: RangoParams) {
  const { desde, hasta } = rango ?? todayRange();
  return useQuery({
    queryKey: ["reportes", "resumen", desde, hasta],
    queryFn: () =>
      fetchApi<ReportesResumen>("/api/reportes/resumen", { desde, hasta }),
  });
}

export function useRecaudoDiario(rango?: RangoParams) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const desde = rango?.desde ?? sevenDaysAgo.toISOString().slice(0, 10);
  const hasta = rango?.hasta ?? new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["reportes", "recaudo-diario", desde, hasta],
    queryFn: () =>
      fetchApi<RecaudoDiario[]>("/api/reportes/recaudo-diario", { desde, hasta }),
  });
}

export function useReportesCobradores(rango?: RangoParams) {
  const { desde, hasta } = rango ?? todayRange();
  return useQuery({
    queryKey: ["reportes", "cobradores", desde, hasta],
    queryFn: () =>
      fetchApi<ReportesCobrador[]>("/api/reportes/cobradores", { desde, hasta }),
  });
}

export function useCarteraRiesgo() {
  return useQuery({
    queryKey: ["reportes", "cartera-riesgo"],
    queryFn: () => fetchApi<CarteraRiesgo>("/api/reportes/cartera-riesgo"),
  });
}

export function useProyeccion(dias = 30) {
  return useQuery({
    queryKey: ["reportes", "proyeccion", dias],
    queryFn: () => fetchApi<Proyeccion>("/api/reportes/proyeccion", { dias }),
  });
}
