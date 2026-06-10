import { apiError } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/api/with-rate-limit";

type RouteContext = { params: Promise<{ path: string[] }> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (request: Request, context?: any) => Promise<Response>;
type RouteModule = Record<string, RouteHandler | undefined>;

async function invokeRoute(
  loadModule: () => Promise<RouteModule>,
  request: Request,
  context?: unknown,
) {
  const routeModule = await loadModule();
  const handler = routeModule[request.method];
  if (!handler) return apiError("NOT_FOUND", "Ruta no encontrada", 404);
  return handler(request, context);
}

async function invokeIdRoute(
  loadModule: () => Promise<RouteModule>,
  request: Request,
  id: string,
) {
  return invokeRoute(loadModule, request, { params: Promise.resolve({ id }) });
}

async function dispatchGet(request: Request, context: RouteContext) {
  const { path } = await context.params;

  switch (path[0]) {
    case "reportes":
      switch (path[1]) {
        case "resumen":
          return invokeRoute(() => import("../reportes/resumen/route"), request);
        case "recaudo-diario":
          return invokeRoute(() => import("../reportes/recaudo-diario/route"), request);
        case "cobradores":
          return invokeRoute(() => import("../reportes/cobradores/route"), request);
        case "cartera-riesgo":
          return invokeRoute(() => import("../reportes/cartera-riesgo/route"), request);
        case "proyeccion":
          return invokeRoute(() => import("../reportes/proyeccion/route"), request);
        case "export":
          return invokeRoute(() => import("../reportes/export/route"), request);
      }
      break;
    case "ruta":
      switch (path[1]) {
        case "hoy":
          return invokeRoute(() => import("../ruta/hoy/route"), request);
      }
      break;
    case "caja":
      switch (path[1]) {
        case "resumen":
          return invokeRoute(() => import("../caja/resumen/route"), request);
        case "historial":
          return invokeRoute(() => import("../caja/historial/route"), request);
        case "cierre-ruta":
          return invokeRoute(() => import("../caja/cierre-ruta/route"), request);
        case "cierre-general":
          return invokeRoute(() => import("../caja/cierre-general/route"), request);
      }
      break;
    case "super-admin":
      switch (path[1]) {
        case "metricas":
          return invokeRoute(() => import("../super-admin/metricas/route"), request);
      }
      break;
    case "prestamos":
      if (path.length === 2) return invokeIdRoute(() => import("../prestamos/[id]/route"), request, path[1]);
      if (path[2] === "cronograma") {
        return invokeIdRoute(() => import("../prestamos/[id]/cronograma/route"), request, path[1]);
      }
      break;
    case "pagos":
      if (path.length === 3 && path[2] === "comprobante") {
        return invokeIdRoute(() => import("../pagos/[id]/comprobante/route"), request, path[1]);
      }
      break;
    case "usuarios":
      if (path.length === 2) return invokeIdRoute(() => import("../usuarios/[id]/route"), request, path[1]);
      break;
    case "clientes":
      if (path.length === 2) return invokeIdRoute(() => import("../clientes/[id]/route"), request, path[1]);
      break;
    case "mora":
      switch (path[1]) {
        case "run":
          return invokeRoute(() => import("../mora/run/route"), request);
        default:
          if (path.length === 3) {
            if (path[2] === "pago") {
              return invokeIdRoute(() => import("../mora/[id]/pago/route"), request, path[1]);
            }
            if (path[2] === "condonar") {
              return invokeIdRoute(() => import("../mora/[id]/condonar/route"), request, path[1]);
            }
          }
      }
      break;
  }

  return apiError("NOT_FOUND", "Ruta no encontrada", 404);
}

async function dispatchPost(request: Request, context: RouteContext) {
  const { path } = await context.params;

  switch (path[0]) {
    case "ruta":
      if (path[1] === "visitas") return invokeRoute(() => import("../ruta/visitas/route"), request);
      break;
    case "super-admin":
      if (path[1] === "tenants") {
        if (path.length === 2) return invokeRoute(() => import("../super-admin/tenants/route"), request);
        if (path.length === 4 && path[3] === "activar") {
          return invokeIdRoute(() => import("../super-admin/tenants/[id]/activar/route"), request, path[2]);
        }
        if (path.length === 4 && path[3] === "suspender") {
          return invokeIdRoute(() => import("../super-admin/tenants/[id]/suspender/route"), request, path[2]);
        }
        if (path.length === 4 && path[3] === "extender-periodo") {
          return invokeIdRoute(() => import("../super-admin/tenants/[id]/extender-periodo/route"), request, path[2]);
        }
      }
      break;
    case "prestamos":
      if (path.length === 3) {
        if (path[2] === "refinanciar") {
          return invokeIdRoute(() => import("../prestamos/[id]/refinanciar/route"), request, path[1]);
        }
        if (path[2] === "cancelar") {
          return invokeIdRoute(() => import("../prestamos/[id]/cancelar/route"), request, path[1]);
        }
      }
      break;
    case "mora":
      if (path.length === 3) {
        if (path[2] === "pago") {
          return invokeIdRoute(() => import("../mora/[id]/pago/route"), request, path[1]);
        }
        if (path[2] === "condonar") {
          return invokeIdRoute(() => import("../mora/[id]/condonar/route"), request, path[1]);
        }
      }
      break;
  }

  return apiError("NOT_FOUND", "Ruta no encontrada", 404);
}

async function dispatchPut(request: Request, context: RouteContext) {
  const { path } = await context.params;
  if (path[0] === "usuarios" && path.length === 2) {
    return invokeIdRoute(() => import("../usuarios/[id]/route"), request, path[1]);
  }
  if (path[0] === "clientes" && path.length === 2) {
    return invokeIdRoute(() => import("../clientes/[id]/route"), request, path[1]);
  }
  if (path[0] === "prestamos" && path.length === 2) {
    return invokeIdRoute(() => import("../prestamos/[id]/route"), request, path[1]);
  }
  return apiError("NOT_FOUND", "Ruta no encontrada", 404);
}

async function dispatchDelete(request: Request, context: RouteContext) {
  const { path } = await context.params;
  if (path[0] === "usuarios" && path.length === 2) {
    return invokeIdRoute(() => import("../usuarios/[id]/route"), request, path[1]);
  }
  if (path[0] === "clientes" && path.length === 2) {
    return invokeIdRoute(() => import("../clientes/[id]/route"), request, path[1]);
  }
  if (path[0] === "prestamos" && path.length === 2) {
    return invokeIdRoute(() => import("../prestamos/[id]/route"), request, path[1]);
  }
  return apiError("NOT_FOUND", "Ruta no encontrada", 404);
}

export async function GET(request: Request, context: RouteContext) {
  return withRateLimit(request, () => dispatchGet(request, context));
}
export async function POST(request: Request, context: RouteContext) {
  return withRateLimit(request, () => dispatchPost(request, context));
}
export async function PUT(request: Request, context: RouteContext) {
  return withRateLimit(request, () => dispatchPut(request, context));
}
export async function DELETE(request: Request, context: RouteContext) {
  return withRateLimit(request, () => dispatchDelete(request, context));
}
