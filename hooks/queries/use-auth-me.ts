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
    horario_inicio: string | null;
    horario_fin: string | null;
    moneda: string;
    cobrar_sabados: boolean;
    cobrar_domingos: boolean;
    geolocalizacion_requerida: boolean;
    whatsapp_template: string | null;
    color_primario: string | null;
  } | null;
};

export function useAuthMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => fetchApi<AuthMeResponse>("/api/auth/me"),
    staleTime: 60_000,
  });
}
