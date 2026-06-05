import { describe, it, expect } from "vitest";
import { clientAs, anonClient, serviceClient } from "./helpers";

describe("Aislamiento multi-tenant (RLS)", () => {
  it("admin de A no ve préstamos de B", async () => {
    const a = await clientAs("admin-a@credicontrol.test");
    const { data } = await a.from("prestamos").select("organization_id");
    expect(data).toBeTruthy();
    expect(data!.length).toBeGreaterThan(0);
    // Todas las filas visibles son de la org de A; ninguna de B.
    const orgs = new Set(data!.map((r) => r.organization_id));
    expect(orgs.size).toBe(1);
  });

  it("admin de A ve 0 clientes de la cédula de B", async () => {
    const a = await clientAs("admin-a@credicontrol.test");
    const { data } = await a.from("clientes").select("id").eq("cedula", "211"); // cédula de B
    expect(data).toEqual([]);
  });

  it("cobrador A1 solo ve préstamos asignados a él (no los de A2)", async () => {
    // id de A1 vía service role
    const svc = serviceClient();
    const { data: a1 } = await svc
      .from("profiles")
      .select("id")
      .eq("nombre_completo", "Cobrador A1")
      .single();

    const c = await clientAs("cobrador-a1@credicontrol.test");
    const { data } = await c.from("prestamos").select("id, cobrador_id");
    expect(data).toBeTruthy();
    expect(data!.length).toBeGreaterThan(0);
    // Toda fila visible está asignada a A1; ninguna de A2.
    for (const row of data!) {
      expect(row.cobrador_id).toBe(a1!.id);
    }
  });

  it("cobrador A1 NO puede insertar un préstamo (solo admin)", async () => {
    const c = await clientAs("cobrador-a1@credicontrol.test");
    const svc = serviceClient();
    const { data: anyCliente } = await svc.from("clientes").select("id, organization_id").limit(1).single();
    const { error } = await c.from("prestamos").insert({
      organization_id: anyCliente!.organization_id,
      cliente_id: anyCliente!.id,
      capital: 100000,
      modelo_interes: "cuota_fija",
      tasa_mensual: 20,
      plazo_dias: 10,
    });
    expect(error).toBeTruthy(); // RLS rechaza el insert
  });

  it("super_admin ve datos de A y de B", async () => {
    const s = await clientAs("super@credicontrol.test");
    const { data } = await s.from("prestamos").select("organization_id");
    expect(data).toBeTruthy();
    const orgs = new Set(data!.map((r) => r.organization_id));
    expect(orgs.size).toBeGreaterThanOrEqual(2); // ve ambas orgs
  });

  it("cliente sin autenticación no obtiene filas", async () => {
    const anon = anonClient();
    const { data } = await anon.from("prestamos").select("id");
    expect(data ?? []).toEqual([]);
  });
});
