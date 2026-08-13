# Conectar acciones pendientes a datos reales — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cablear cuatro acciones que hoy muestran datos falsos (dashboard del cobrador, condonar mora, pagar mora, refinanciar préstamo) a los endpoints/datos reales que ya existen.

**Architecture:** Casi todo es frontend: reemplazar mocks y simulaciones (`console.log` + `toast`) por hooks de React Query y `fetch` reales, con invalidación de queries. Un cambio pequeño de backend (condonar guarda el motivo), un arreglo de backend (refinanciar copia `dia_cobro`) y una migración de columnas de auditoría en `mora_registros`.

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres + RLS), TanStack Query v5, react-hook-form + zod, Tailwind v4.

## Global Constraints

- Este es un Next.js con breaking changes; ante cualquier duda de API de Next, leer `node_modules/next/dist/docs/` antes de escribir código (regla de `AGENTS.md`).
- No crear endpoints nuevos. Reutilizar los existentes.
- `lib/database.types.ts` se parchea quirúrgicamente (solo las líneas nuevas), nunca reescritura total.
- Al hacer `git add`, revisar `git status --short` y agregar SOLO los archivos de cada tarea — hay sesiones concurrentes editando el mismo working tree; nunca tocar/incluir trabajo ajeno.
- No inventar un harness de tests de API. Verificación por tarea: `npx tsc --noEmit` limpio + `npx eslint <archivos>` limpio. Verificación funcional al final vía SQL directo.
- Mensajes de commit en español, terminando con la línea `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Enum `estado_mora`: valores `activa | pagada | condonada`.

---

### Task 1: Migración — auditoría de condonación de mora

**Files:**
- Create: `supabase/migrations/20260812_mora_condonacion_audit.sql`
- Modify: `lib/database.types.ts:265-294` (bloques Row/Insert/Update de `mora_registros`)

**Interfaces:**
- Produces: columnas `mora_registros.motivo_condonacion` (text, nullable), `mora_registros.condonado_por` (uuid, nullable, FK a `profiles.id`), `mora_registros.condonado_at` (timestamptz, nullable). Consumidas por Task 2.

- [ ] **Step 1: Escribir la migración**

Crear `supabase/migrations/20260812_mora_condonacion_audit.sql`:

```sql
-- Auditoría de condonación de mora: quién condonó, cuándo y por qué.
alter table public.mora_registros
  add column if not exists motivo_condonacion text,
  add column if not exists condonado_por uuid references public.profiles(id),
  add column if not exists condonado_at timestamptz;
```

- [ ] **Step 2: Aplicar la migración**

Aplicar vía la herramienta MCP de Supabase (`apply_migration`, nombre `mora_condonacion_audit`). Si el endpoint MCP devuelve un error transitorio (p.ej. Cloudflare 520), verificar con `execute_sql` si se aplicó antes de reintentar.

Verificar:
```sql
select column_name from information_schema.columns
where table_name = 'mora_registros'
  and column_name in ('motivo_condonacion','condonado_por','condonado_at');
```
Expected: 3 filas.

- [ ] **Step 3: Parchear `lib/database.types.ts` (quirúrgico)**

En el bloque `Row:` de `mora_registros` (después de `monto_pagado_mora: number`), agregar:
```ts
          condonado_at: string | null
          condonado_por: string | null
          motivo_condonacion: string | null
```
En el bloque `Insert:` (después de `monto_pagado_mora?: number`), agregar:
```ts
          condonado_at?: string | null
          condonado_por?: string | null
          motivo_condonacion?: string | null
```
En el bloque `Update:` (después de `monto_pagado_mora?: number`), agregar:
```ts
          condonado_at?: string | null
          condonado_por?: string | null
          motivo_condonacion?: string | null
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos (los ~40 fallos preexistentes en `.worktrees/**` no cuentan).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260812_mora_condonacion_audit.sql lib/database.types.ts
git commit -m "feat: columnas de auditoría de condonación en mora_registros"
```

---

### Task 2: Endpoint condonar guarda el motivo

**Files:**
- Modify: `app/api/mora/[id]/condonar/route.ts`

**Interfaces:**
- Consumes: columnas de Task 1.
- Produces: `POST /api/mora/[id]/condonar` acepta body `{ motivo: string }` y persiste `motivo_condonacion`, `condonado_por`, `condonado_at`. Consumido por Task 5.

- [ ] **Step 1: Modificar el handler**

Reemplazar el cuerpo de `POST` para validar el body y guardar los campos de auditoría. El archivo completo queda:

```ts
import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ motivo: z.string().trim().min(3) });
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  const parsed = await parseJson(request, schema);
  if (parsed.response) return parsed.response;
  const { id } = await context.params;
  const supabase = await createClient();
  let query = supabase
    .from("mora_registros")
    .update({
      estado: "condonada",
      motivo_condonacion: parsed.data!.motivo,
      condonado_por: actor!.userId,
      condonado_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*");
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  const { data, error } = await query.maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Mora no encontrada", 404);
  return apiOk(data);
}
```

- [ ] **Step 2: Verificar tipos y lint**

Run: `npx tsc --noEmit && npx eslint "app/api/mora/[id]/condonar/route.ts"`
Expected: limpio.

- [ ] **Step 3: Commit**

```bash
git add "app/api/mora/[id]/condonar/route.ts"
git commit -m "feat: condonar mora persiste motivo y datos de auditoría"
```

---

### Task 3: Refinanciar copia el dia_cobro

**Files:**
- Modify: `app/api/prestamos/[id]/refinanciar/route.ts:34-51`

**Interfaces:**
- Produces: el préstamo refinanciado hereda `dia_cobro` del original. Sin cambio de firma (consumido por Task 6 vía el mismo endpoint).

- [ ] **Step 1: Agregar `dia_cobro` al insert**

En el objeto pasado a `admin.from("prestamos").insert({...})`, agregar el campo (junto a los demás, orden alfabético para respetar el estilo del archivo — va después de `cuota_diaria`):

```ts
    dia_cobro: previous.dia_cobro,
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: limpio (`previous` es un `prestamos` Row, ya tiene `dia_cobro`).

- [ ] **Step 3: Commit**

```bash
git add "app/api/prestamos/[id]/refinanciar/route.ts"
git commit -m "fix: refinanciar perdía el dia_cobro del préstamo original"
```

---

### Task 4: Dashboard del cobrador con datos reales

**Files:**
- Modify: `components/domain/cobrador-dashboard.tsx`
- Modify: `lib/mock/ruta.ts`

**Interfaces:**
- Consumes: `useRutaHoy()` (`hooks/queries/use-ruta.ts`), `usePagos()` (`hooks/queries/use-pagos.ts`).

- [ ] **Step 1: Reemplazar los mocks por hooks reales**

En `components/domain/cobrador-dashboard.tsx`:
- Quitar `import { MOCK_DAILY_SUMMARY, MOCK_PAGOS_HOY } from "@/lib/mock/ruta";`.
- Agregar `import { useRutaHoy } from "@/hooks/queries/use-ruta";` y `import { usePagos } from "@/hooks/queries/use-pagos";`.
- Dentro del componente, reemplazar `const summary = MOCK_DAILY_SUMMARY;` por datos derivados de `useRutaHoy()`:

```tsx
  const { data: rutaItems = [], isLoading: loadingRuta } = useRutaHoy();
  const { data: pagos = [] } = usePagos();

  const totalEsperado = rutaItems.reduce((acc, i) => acc + i.monto_esperado, 0);
  const totalRecaudado = rutaItems.reduce((acc, i) => acc + i.monto_pagado, 0);
  const cobrosPendientes = rutaItems.filter(
    (i) => i.estado === "pendiente" || i.estado === "parcial" || i.estado === "mora",
  ).length;
  const pctCumplimiento = totalEsperado > 0
    ? Math.round((totalRecaudado / totalEsperado) * 100)
    : 0;
  const ultimosPagos = pagos.slice(0, 3);
```

- Reemplazar todos los usos de `summary.totalEsperado`, `summary.totalRecaudado`,
  `summary.cobrosPendientes` por las variables locales anteriores.
- Reemplazar el bloque `{MOCK_PAGOS_HOY.slice(0, 3).map(...)}` por
  `{ultimosPagos.map((pago) => (...))}`, adaptando los campos: el `Pago` real usa
  `pago.clientes?.nombre ?? "Cliente"`, `pago.medio_pago`, `pago.monto`, y
  `new Date(pago.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })`
  para la hora. Ya no hay `pago.cuota`; mostrar solo cliente + hora.

- [ ] **Step 2: Estados de carga y vacío**

- Si `loadingRuta`, mostrar un skeleton o un texto tenue "Cargando tu día…" en la
  tarjeta principal (usar el mismo patrón mínimo que ya exista en el archivo; si no
  hay, un `<p className="text-sm text-muted-foreground">` basta).
- Si `ultimosPagos.length === 0`, en la sección "Últimos pagos" mostrar
  `<Card padding="sm"><p className="text-sm text-muted-foreground">Sin pagos registrados aún.</p></Card>`
  en vez del `.map`.

- [ ] **Step 3: Limpiar mocks sin uso en `lib/mock/ruta.ts`**

Eliminar de `lib/mock/ruta.ts`: `MOCK_DAILY_SUMMARY`, `MOCK_PAGOS_HOY`,
`MOCK_ROUTE_ITEMS`, `MOCK_NEGOCIO`, `MOCK_COBRADOR`, y los tipos `DailySummary` y
`PagoRecord` (y la constante `TODAY_STR`/`NOW` si quedan sin uso). **Conservar**
los tipos `RouteItem` y `RouteItemStatus` (los usan `route-card.tsx`,
`payment-sheet.tsx`, `app/app/ruta/page.tsx`) y el import de `MedioPago`.

- [ ] **Step 4: Verificar que no quedaron referencias colgando**

Run: `grep -rn "MOCK_DAILY_SUMMARY\|MOCK_PAGOS_HOY\|MOCK_ROUTE_ITEMS\|MOCK_NEGOCIO\|MOCK_COBRADOR" app hooks components lib | grep -v node_modules`
Expected: sin resultados (salvo `MOCK_NEGOCIO`/`MOCK_COBRADOR` que están definidos aparte en `lib/mock/reportes.ts` y `lib/mock/admin.ts` — esos NO se tocan).

Nota: si `grep` muestra las definiciones propias de `reportes.ts`/`admin.ts`, está bien; lo que no debe quedar es ninguna referencia a las de `lib/mock/ruta.ts`.

- [ ] **Step 5: Verificar tipos y lint**

Run: `npx tsc --noEmit && npx eslint components/domain/cobrador-dashboard.tsx lib/mock/ruta.ts`
Expected: limpio.

- [ ] **Step 6: Commit**

```bash
git add components/domain/cobrador-dashboard.tsx lib/mock/ruta.ts
git commit -m "fix: dashboard del cobrador mostraba datos mock en vez de su ruta real"
```

---

### Task 5: Página de mora — conectar Pagar/Condonar y ocultar para cobradores

**Files:**
- Modify: `app/app/mora/page.tsx`

**Interfaces:**
- Consumes: `POST /api/mora/[id]/pago` `{ monto }`, `POST /api/mora/[id]/condonar` `{ motivo }` (Task 2), `useAuth().role`.

- [ ] **Step 1: Imports**

En `app/app/mora/page.tsx` agregar:
```ts
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
```

- [ ] **Step 2: Conectar `PagarMoraButton.onSubmit`**

Dentro de `PagarMoraButton`, obtener `const queryClient = useQueryClient();` y volver
async el submit:

```tsx
  async function onSubmit(data: { monto: number }) {
    try {
      const res = await fetch(`/api/mora/${mora.id}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: data.monto }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string }; message?: string }).error?.message ??
            (body as { message?: string }).message ??
            "No se pudo registrar el pago de mora",
        );
      }
      toast.success("Pago de mora registrado");
      await queryClient.invalidateQueries({ queryKey: ["mora"] });
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el pago");
    }
  }
```
Cambiar la firma de `handleSubmit(onSubmit)` para que reciba `data` (ya lo hace; solo
asegurar que `onSubmit` recibe el argumento). El botón "Registrar pago" usa
`loading={isSubmitting}` — mantener.

- [ ] **Step 3: Conectar `CondonarMoraButton.onSubmit`**

Dentro de `CondonarMoraButton`, obtener `const queryClient = useQueryClient();` y:

```tsx
  async function onSubmit(data: { motivo: string }) {
    try {
      const res = await fetch(`/api/mora/${mora.id}/condonar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: data.motivo }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string }; message?: string }).error?.message ??
            (body as { message?: string }).message ??
            "No se pudo condonar la mora",
        );
      }
      toast.success("Mora condonada correctamente");
      await queryClient.invalidateQueries({ queryKey: ["mora"] });
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo condonar la mora");
    }
  }
```
Asegurar que el `handleSubmit(onSubmit)` pase `data` (el form ya tiene el campo
`motivo` registrado). Si el botón de submit usa `isSubmitting`, mantenerlo.

- [ ] **Step 4: Ocultar Pagar/Condonar para cobradores**

En el componente de la tarjeta de mora (donde se renderiza el bloque
`{mora.estado === "activa" && (<div ...><PagarMoraButton/><CondonarMoraButton/><WhatsAppButton/></div>)}`),
obtener `const { role } = useAuth();` y envolver solo esos dos botones:

```tsx
      {mora.estado === "activa" && (
        <div className="mt-3.5 flex gap-2 border-t border-dashed border-border pt-3">
          {role !== "cobrador" && <PagarMoraButton mora={mora} />}
          {role !== "cobrador" && <CondonarMoraButton mora={mora} />}
          <WhatsAppButton
            telefono={mora.prestamos.clientes.telefono ?? ""}
            cliente={mora.prestamos.clientes.nombre}
          />
        </div>
      )}
```
(`useAuth` debe llamarse en el componente de la tarjeta, que es un componente
React válido; verificar que ese componente sea una función-componente y no una
función auxiliar.)

- [ ] **Step 5: Verificar tipos y lint**

Run: `npx tsc --noEmit && npx eslint app/app/mora/page.tsx`
Expected: limpio.

- [ ] **Step 6: Commit**

```bash
git add app/app/mora/page.tsx
git commit -m "fix: pagar/condonar mora ahora persisten; ocultos para cobradores"
```

---

### Task 6: Refinanciar — formulario real conectado al endpoint

**Files:**
- Modify: `app/app/prestamos/[id]/page.tsx` (`RefinanciarButton` y su punto de uso ~línea 255)

**Interfaces:**
- Consumes: `POST /api/prestamos/[id]/refinanciar`, `prestamoStep2Schema` de `@/lib/schemas/admin`, `Prestamo` de `@/hooks/queries/use-prestamos`, `useRouter` de `next/navigation`.

- [ ] **Step 1: Pasar el préstamo completo al botón**

En el punto de uso (~línea 255), cambiar:
```tsx
{canRefinance && <RefinanciarButton prestamoId={prestamo.id} />}
```
por:
```tsx
{canRefinance && <RefinanciarButton prestamo={prestamo} />}
```

- [ ] **Step 2: Reescribir `RefinanciarButton`**

Reemplazar la función `RefinanciarButton` completa por un formulario corto. Asegurar
imports en el archivo: `useForm`, `zodResolver`, `prestamoStep2Schema` +
`type PrestamoStep2Data`, `useRouter`, `Input`, `Select`, `useQueryClient`. Usar el
patrón `<Dialog footer={...}>` ya establecido:

```tsx
function RefinanciarButton({ prestamo }: { prestamo: Prestamo }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrestamoStep2Data>({
    resolver: zodResolver(prestamoStep2Schema),
    defaultValues: {
      capital: prestamo.capital,
      modeloInteres: prestamo.modelo_interes,
      tasaMensual: prestamo.tasa_mensual,
      plazoDias: prestamo.plazo_dias,
      fechaInicio: new Date().toISOString().slice(0, 10),
      excluirSabados: prestamo.excluir_sabados,
      excluirDomingos: prestamo.excluir_domingos,
    },
  });

  async function onSubmit(data: PrestamoStep2Data) {
    setSaving(true);
    try {
      const res = await fetch(`/api/prestamos/${prestamo.id}/refinanciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capital: data.capital,
          modeloInteres: data.modeloInteres,
          tasaMensual: data.tasaMensual,
          plazoDias: data.plazoDias,
          fechaInicio: data.fechaInicio,
          excluirSabados: data.excluirSabados,
          excluirDomingos: data.excluirDomingos,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string }; message?: string }).error?.message ??
            (body as { message?: string }).message ??
            "No se pudo refinanciar el préstamo",
        );
      }
      const created = (await res.json()) as { data?: { id?: string } };
      toast.success("Préstamo refinanciado correctamente");
      await queryClient.invalidateQueries({ queryKey: ["prestamos"] });
      setOpen(false);
      if (created.data?.id) router.push(`/app/prestamos/${created.data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo refinanciar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="flex-1">
        <RefreshCcw className="mr-2 h-4 w-4" />
        Refinanciar
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Refinanciar préstamo"
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" form="refinanciar-form" loading={saving} className="flex-1">
              Refinanciar
            </Button>
          </div>
        }
      >
        <form id="refinanciar-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            Se creará un préstamo nuevo con estas condiciones. El actual pasará a
            estado &ldquo;Refinanciado&rdquo;.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Capital" type="number" error={errors.capital?.message} {...register("capital", { valueAsNumber: true })} />
            <Select
              label="Modelo de interés"
              options={[
                { value: "cuota_fija", label: "Cuota fija" },
                { value: "solo_interes", label: "Solo interés" },
                { value: "sobre_saldo", label: "Sobre saldo" },
              ]}
              error={errors.modeloInteres?.message}
              {...register("modeloInteres")}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Tasa mensual (%)" type="number" step="0.1" error={errors.tasaMensual?.message} {...register("tasaMensual", { valueAsNumber: true })} />
            <Input label="Plazo (días)" type="number" error={errors.plazoDias?.message} {...register("plazoDias", { valueAsNumber: true })} />
          </div>
          <Input label="Fecha de inicio" type="date" error={errors.fechaInicio?.message} {...register("fechaInicio")} />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("excluirSabados")} className="h-4 w-4 rounded border-border" />
              Excluir sábados
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("excluirDomingos")} className="h-4 w-4 rounded border-border" />
              Excluir domingos
            </label>
          </div>
        </form>
      </Dialog>
    </>
  );
}
```

Nota: `prestamoStep2Schema` no incluye `clienteId` (el refinanciamiento conserva el
cliente del préstamo anterior en el backend), por eso se usa ese schema y no
`editarPrestamoSchema`.

- [ ] **Step 3: Verificar tipos y lint**

Run: `npx tsc --noEmit && npx eslint "app/app/prestamos/[id]/page.tsx"`
Expected: limpio. Si `useRouter`/`useQueryClient`/`Select` ya estaban importados, no
duplicar; si faltan, agregarlos.

- [ ] **Step 4: Commit**

```bash
git add "app/app/prestamos/[id]/page.tsx"
git commit -m "feat: refinanciar préstamo con formulario real conectado a la API"
```

---

### Task 7: Verificación funcional y cierre

**Files:** ninguno (verificación).

- [ ] **Step 1: Typecheck y lint globales**

Run: `rm -rf .next && npx tsc --noEmit`
Expected: sin errores nuevos fuera de `.worktrees/**`.

- [ ] **Step 2: Verificación funcional vía SQL**

Con la ayuda del usuario (o datos de prueba de una organización real), verificar en
Supabase que:
- Condonar una mora deja `estado='condonada'`, `motivo_condonacion`, `condonado_por`
  y `condonado_at` poblados.
- Pagar una mora incrementa `monto_pagado_mora` y marca `pagada` si se cubre.
- Refinanciar crea un préstamo nuevo con `prestamo_anterior_id` apuntando al viejo,
  el viejo en `estado='refinanciado'`, y el nuevo con el mismo `dia_cobro`.

- [ ] **Step 3: Finalizar la rama**

**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch.

## Self-Review

- **Cobertura del spec:** dashboard cobrador → Task 4; condonar (migración+endpoint+UI) → Tasks 1,2,5; pagar mora → Task 5; refinanciar (endpoint dia_cobro + UI) → Tasks 3,6; ocultar botones para cobrador → Task 5. Todo cubierto.
- **Sin placeholders:** cada paso trae el código o el comando exacto.
- **Consistencia de tipos:** `RefinanciarButton` pasa de `{ prestamoId }` a `{ prestamo: Prestamo }` (Task 6 Steps 1-2 alineados); `prestamoStep2Schema`/`PrestamoStep2Data` usados coherentemente; columnas nuevas de `mora_registros` definidas en Task 1 y consumidas en Task 2.
