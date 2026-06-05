import { describe, expect, it } from "vitest";

const modules = [
  () => import("../../app/api/mora/route"),
  () => import("../../app/api/mora/run/route"),
  () => import("../../app/api/mora/[id]/pago/route"),
  () => import("../../app/api/mora/[id]/condonar/route"),
  () => import("../../app/api/prestamos/[id]/cancelar/route"),
  () => import("../../app/api/prestamos/[id]/refinanciar/route"),
  () => import("../../app/api/caja/resumen/route"),
  () => import("../../app/api/caja/cierre-ruta/route"),
  () => import("../../app/api/caja/cierre-general/route"),
  () => import("../../app/api/caja/historial/route"),
  () => import("../../app/api/ruta/visitas/route"),
];

describe("operation API contract files", () => {
  it.each(modules)("imports route module %#", async (loadModule) => {
    await expect(loadModule()).resolves.toBeTruthy();
  });
});
