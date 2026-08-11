import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi, postApi } from "./fetch-api";

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

function useTenantMutation(action: "activar" | "suspender") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => postApi<Tenant>(`/api/super-admin/tenants/${tenantId}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenants"] });
    },
  });
}

export function useActivarTenant() {
  return useTenantMutation("activar");
}

export function useSuspenderTenant() {
  return useTenantMutation("suspender");
}

export function useExtenderTrialTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, trialHasta }: { tenantId: string; trialHasta: string }) =>
      postApi<Tenant>(`/api/super-admin/tenants/${tenantId}/extender-periodo`, { trialHasta }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenants"] });
    },
  });
}
