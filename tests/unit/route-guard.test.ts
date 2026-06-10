import { describe, it, expect } from "vitest";
import { evaluateRouteAccess } from "@/lib/auth/route-guard";

describe("evaluateRouteAccess", () => {
  it("redirige a /login si /app sin sesión, preservando redirect", () => {
    const d = evaluateRouteAccess({ pathname: "/app/prestamos", isAuthenticated: false, role: null, subscriptionActive: false });
    expect(d).toEqual({ action: "redirect", to: "/login?redirect=%2Fapp%2Fprestamos" });
  });

  it("permite admin con suscripción activa en /app", () => {
    const d = evaluateRouteAccess({ pathname: "/app", isAuthenticated: true, role: "admin", subscriptionActive: true });
    expect(d).toEqual({ action: "allow" });
  });

  it("redirige a /suscripcion-vencida si /app con suscripción inactiva", () => {
    const d = evaluateRouteAccess({ pathname: "/app/caja", isAuthenticated: true, role: "admin", subscriptionActive: false });
    expect(d).toEqual({ action: "redirect", to: "/suscripcion-vencida" });
  });

  it("redirige a /app si cobrador intenta entrar a ruta de super-admin", () => {
    const d = evaluateRouteAccess({ pathname: "/tenants", isAuthenticated: true, role: "cobrador", subscriptionActive: true });
    expect(d).toEqual({ action: "redirect", to: "/app" });
  });

  it("permite super_admin en /dashboard", () => {
    const d = evaluateRouteAccess({ pathname: "/dashboard", isAuthenticated: true, role: "super_admin", subscriptionActive: true });
    expect(d).toEqual({ action: "allow" });
  });

  it("redirige usuario autenticado fuera de /login según su rol", () => {
    expect(evaluateRouteAccess({ pathname: "/login", isAuthenticated: true, role: "admin", subscriptionActive: true }))
      .toEqual({ action: "redirect", to: "/app" });
    expect(evaluateRouteAccess({ pathname: "/login", isAuthenticated: true, role: "super_admin", subscriptionActive: true }))
      .toEqual({ action: "redirect", to: "/dashboard" });
  });

  it("permite /suscripcion-vencida aunque la suscripción esté inactiva", () => {
    const d = evaluateRouteAccess({ pathname: "/suscripcion-vencida", isAuthenticated: true, role: "admin", subscriptionActive: false });
    expect(d).toEqual({ action: "allow" });
  });

  it("permite rutas públicas no protegidas sin sesión", () => {
    const d = evaluateRouteAccess({ pathname: "/", isAuthenticated: false, role: null, subscriptionActive: false });
    expect(d).toEqual({ action: "allow" });
  });
});
