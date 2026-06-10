import type { AppRole } from "@/lib/auth";

export type RouteRole = AppRole | null;
export type RouteDecision = { action: "allow" } | { action: "redirect"; to: string };

// Rutas del grupo (super-admin): los route groups NO añaden segmento a la URL.
const SUPER_ADMIN_PREFIXES = ["/dashboard", "/tenants", "/suscripciones", "/metricas"];
const AUTH_PAGES = ["/login", "/register"];

export function evaluateRouteAccess(params: {
  pathname: string;
  isAuthenticated: boolean;
  role: RouteRole;
  subscriptionActive: boolean;
}): RouteDecision {
  const { pathname, isAuthenticated, role, subscriptionActive } = params;

  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
  const isSuperAdminRoute = SUPER_ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Usuario autenticado en páginas de auth → a su home solo si tiene rol conocido.
  // Si role es null (JWT aún sin custom claim) se permite la página de auth
  // para evitar el loop /login ↔ /app.
  if (isAuthenticated && isAuthPage) {
    if (role === "super_admin") return { action: "redirect", to: "/dashboard" };
    if (role === "admin" || role === "cobrador") return { action: "redirect", to: "/app" };
    return { action: "allow" };
  }

  if (isAppRoute) {
    if (!isAuthenticated) {
      return { action: "redirect", to: `/login?redirect=${encodeURIComponent(pathname)}` };
    }
    if (role === "super_admin") {
      return { action: "redirect", to: "/dashboard" };
    }
    if (role !== "admin" && role !== "cobrador") {
      return { action: "redirect", to: "/login?error=no-access" };
    }
    if (!subscriptionActive) {
      return { action: "redirect", to: "/suscripcion-vencida" };
    }
    return { action: "allow" };
  }

  if (isSuperAdminRoute) {
    if (!isAuthenticated) return { action: "redirect", to: "/login" };
    if (role !== "super_admin") return { action: "redirect", to: "/app" };
    return { action: "allow" };
  }

  // Todo lo demás (/, /suscripcion-vencida, assets, etc.) se permite
  return { action: "allow" };
}
