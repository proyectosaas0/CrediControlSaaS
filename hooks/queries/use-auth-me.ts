import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type AuthMeResponse = {
  actor: {
    userId: string;
    role: string;
    organizationId: string | null;
  };
  profile: {
    id: string;
    organization_id: string | null;
    nombre_completo: string;
    rol: string;
    telefono: string | null;
    activo: boolean;
    ultimo_acceso: string | null;
  } | null;
  organization: {
    id: string;
    nombre_negocio: string;
    logo_url: string | null;
    ciudad: string | null;
    telefono: string | null;
    plan: string;
    estado_suscripcion: string;
    trial_hasta: string | null;
    created_at: string;
  } | null;
};

export function useAuthMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => fetchApi<AuthMeResponse>("/api/auth/me"),
    staleTime: 60_000,
  });
}
