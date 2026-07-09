import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createUser(
  email: string,
  password: string,
  meta: Record<string, unknown>,
): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) {
    // Si el usuario ya existe, intentar recuperar su id a partir del perfil
    if (error.message && error.message.includes("already been registered")) {
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("nombre_completo", meta.nombre_completo as string)
        .maybeSingle();
      if (existing && existing.id) return existing.id;
    }
    throw new Error(`createUser ${email}: ${error.message}`);
  }
  return data.user!.id;
}

async function main() {
  // 1) Super admin: sin organization_id (no pasa metadata de org → el trigger
  //    intentaría crear org. Para super_admin lo creamos SIN disparar el flujo
  //    normal: pasamos un flag y ajustamos el perfil después.)
  const superId = await createUser("super@credicontrol.test", "Password123!", {
    nombre_completo: "Super Admin",
    nombre_negocio: "__superadmin__",
  });
  // Reasignar a super_admin global
  await admin.from("profiles").update({ rol: "super_admin", organization_id: null }).eq("id", superId);
  // Borrar la org placeholder creada por el trigger
  await admin.from("organizations").delete().eq("nombre_negocio", "__superadmin__");

  // 2) Org A — admin + 2 cobradores
  const adminAId = await createUser("admin-a@credicontrol.test", "Password123!", {
    nombre_completo: "Admin A",
    nombre_negocio: "Préstamos La Esperanza",
    ciudad: "Valledupar",
    telefono: "3000000001",
  });
  const { data: profA } = await admin.from("profiles").select("organization_id").eq("id", adminAId).single();
  const orgA = profA!.organization_id!;

  const cobA1 = await createUser("cobrador-a1@credicontrol.test", "Password123!", {
    nombre_completo: "Cobrador A1",
    organization_id: orgA,
    rol: "cobrador",
  });
  const cobA2 = await createUser("cobrador-a2@credicontrol.test", "Password123!", {
    nombre_completo: "Cobrador A2",
    organization_id: orgA,
    rol: "cobrador",
  });

  // 3) Org B — admin + 1 cobrador
  const adminBId = await createUser("admin-b@credicontrol.test", "Password123!", {
    nombre_completo: "Admin B",
    nombre_negocio: "Crédito Rápido B",
    ciudad: "Bogotá",
    telefono: "3000000002",
  });
  const { data: profB } = await admin.from("profiles").select("organization_id").eq("id", adminBId).single();
  const orgB = profB!.organization_id!;

  const cobB1 = await createUser("cobrador-b1@credicontrol.test", "Password123!", {
    nombre_completo: "Cobrador B1",
    organization_id: orgB,
    rol: "cobrador",
  });

  // 4) Clientes + préstamos + cronograma (vía service role, bypassa RLS)
  const { data: cliA } = await admin
    .from("clientes")
    .insert([
      { organization_id: orgA, nombre: "Cliente A-Uno", cedula: "111", telefono: "3101111111" },
      { organization_id: orgA, nombre: "Cliente A-Dos", cedula: "112", telefono: "3101111112" },
      { organization_id: orgA, nombre: "Cliente A-Tres", cedula: "113", telefono: "3101111113" },
    ])
    .select();

  const { data: cliB } = await admin
    .from("clientes")
    .insert([
      { organization_id: orgB, nombre: "Cliente B-Uno", cedula: "211", telefono: "3202222221" },
      { organization_id: orgB, nombre: "Cliente B-Dos", cedula: "212", telefono: "3202222222" },
    ])
    .select();

  // Préstamo de A asignado a cobrador A1
  const { data: presA } = await admin
    .from("prestamos")
    .insert([
      {
        organization_id: orgA,
        cliente_id: cliA![0].id,
        cobrador_id: cobA1,
        capital: 1000000,
        modelo_interes: "cuota_fija",
        tasa_mensual: 20,
        total_pagar: 1200000,
        cuota_diaria: 60000,
        plazo_dias: 20,
        created_by: adminAId,
      },
      {
        organization_id: orgA,
        cliente_id: cliA![1].id,
        cobrador_id: cobA2,
        capital: 500000,
        modelo_interes: "cuota_fija",
        tasa_mensual: 20,
        total_pagar: 600000,
        cuota_diaria: 60000,
        plazo_dias: 10,
        created_by: adminAId,
      },
    ])
    .select();

  // Préstamo de B asignado a cobrador B1
  const { data: presB } = await admin
    .from("prestamos")
    .insert([
      {
        organization_id: orgB,
        cliente_id: cliB![0].id,
        cobrador_id: cobB1,
        capital: 800000,
        modelo_interes: "cuota_fija",
        tasa_mensual: 15,
        total_pagar: 920000,
        cuota_diaria: 46000,
        plazo_dias: 20,
        created_by: adminBId,
      },
    ])
    .select();

  // Una cuota de cronograma por préstamo (suficiente para los tests)
  await admin.from("cronograma_pagos").insert([
    { prestamo_id: presA![0].id, organization_id: orgA, numero_cuota: 1, fecha_esperada: "2026-06-05", monto_esperado: 60000, cobrador_id: cobA1 },
    { prestamo_id: presA![1].id, organization_id: orgA, numero_cuota: 1, fecha_esperada: "2026-06-05", monto_esperado: 60000, cobrador_id: cobA2 },
    { prestamo_id: presB![0].id, organization_id: orgB, numero_cuota: 1, fecha_esperada: "2026-06-05", monto_esperado: 46000, cobrador_id: cobB1 },
  ]);

  console.log("Seed completo:", { orgA, orgB, superId, adminAId, adminBId, cobA1, cobA2, cobB1 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
