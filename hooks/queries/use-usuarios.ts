import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-api";

export type Usuario = {
  id: string;
  nombre_completo: string;
  email: string;
  rol: "admin" | "cobrador";
  telefono: string | null;
  activo: boolean;
  ultimo_acceso: string | null;
};

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: () => fetchApi<Usuario[]>("/api/usuarios"),
  });
}
