import { describe, expect, it } from "vitest";

const modules = [
  () => import("../../app/api/reportes/resumen/route"),
  () => import("../../app/api/reportes/cobradores/route"),
  () => import("../../app/api/reportes/cartera-riesgo/route"),
  () => import("../../app/api/reportes/proyeccion/route"),
  () => import("../../app/api/reportes/export/route"),
  () => import("../../app/api/super-admin/tenants/route"),
  () => import("../../app/api/super-admin/tenants/[id]/route"),
  () => import("../../app/api/super-admin/tenants/[id]/activar/route"),
  () => import("../../app/api/super-admin/tenants/[id]/suspender/route"),
  () => import("../../app/api/super-admin/tenants/[id]/extender-periodo/route"),
  () => import("../../app/api/super-admin/metricas/route"),
];

describe("intelligence API contract files", () => {
  it.each(modules)("imports route module %#", async (loadModule) => {
    await expect(loadModule()).resolves.toBeTruthy();
  });
});
