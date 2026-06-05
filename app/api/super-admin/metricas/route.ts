import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/server/admin-supabase";

export async function GET() {
  const { response } = await requireApiActor(["super_admin"]);
  if (response) return response;
  const admin = createAdminClient();
  const [{ count: tenants, error: tenantsError }, { count: prestamos, error: prestamosError }, { count: pagos, error: pagosError }] = await Promise.all([
    admin.from("organizations").select("id", { count: "exact", head: true }),
    admin.from("prestamos").select("id", { count: "exact", head: true }),
    admin.from("pagos").select("id", { count: "exact", head: true }),
  ]);
  if (tenantsError) return apiError("INTERNAL_ERROR", tenantsError.message, 500);
  if (prestamosError) return apiError("INTERNAL_ERROR", prestamosError.message, 500);
  if (pagosError) return apiError("INTERNAL_ERROR", pagosError.message, 500);
  return apiOk({ pagosRegistrados: pagos ?? 0, prestamos: prestamos ?? 0, tenants: tenants ?? 0 });
}
