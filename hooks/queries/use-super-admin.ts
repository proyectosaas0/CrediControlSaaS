import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type SuperAdminMetricas = {
  tenants: number;
  prestamos: number;
  pagosRegistrados: number;
};

export type Tenant = {
  id: string;
  nombre_negocio: string;
  ciudad: string | null;
  telefono: string | null;
  plan: string;
  estado_suscripcion: string;
  trial_hasta: string | null;
  created_at: string;
};

export function useSuperAdminMetricas() {
  return useQuery({
    queryKey: ["super-admin", "metricas"],
    queryFn: () => fetchApi<SuperAdminMetricas>("/api/super-admin/metricas"),
  });
}

export function useTenants() {
  return useQuery({
    queryKey: ["super-admin", "tenants"],
    queryFn: () => fetchApi<Tenant[]>("/api/super-admin/tenants"),
  });
}
