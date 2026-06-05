import { requireApiActor } from "@/lib/api/auth";
import { apiOk } from "@/lib/api/errors";

type Cobrador = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  activo: boolean;
  comision: number;
};

// TODO: Replace with real data from Supabase when 'cobradores' table is created
const MOCK_COBRADORES: Cobrador[] = [
  {
    id: "cb-1",
    nombre: "Juan Perez",
    telefono: "+573001234567",
    email: "juan@example.com",
    activo: true,
    comision: 5.0,
  },
  {
    id: "cb-2",
    nombre: "Ana Gomez",
    telefono: "+573007654321",
    email: "ana@example.com",
    activo: true,
    comision: 5.0,
  },
  {
    id: "cb-3",
    nombre: "Luis Herrera",
    telefono: "+573009876543",
    email: "luis@example.com",
    activo: false,
    comision: 5.0,
  },
];

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();
  const activo = url.searchParams.get("activo");

  let result = MOCK_COBRADORES;

  if (activo === "true") result = result.filter((c) => c.activo);
  if (activo === "false") result = result.filter((c) => !c.activo);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.telefono.includes(q)
    );
  }

  return apiOk(result);
}
