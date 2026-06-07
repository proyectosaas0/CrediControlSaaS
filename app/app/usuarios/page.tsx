"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  UserX,
  Mail,
  Phone,
  KeyRound,
  Trash2,
  Shield,
  User,
  UsersRound,
} from "lucide-react";
import { useUsuarios, type Usuario } from "@/hooks/queries/use-usuarios";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { cn } from "@/components/ui/cn";

const ROL_CONFIG: Record<string, { label: string; variant: "primary" | "muted" }> = {
  admin: { label: "Admin", variant: "primary" },
  cobrador: { label: "Cobrador", variant: "muted" },
};

export default function UsuariosPage() {
  const { data: usuarios = [], isPending, error, refetch } = useUsuarios();

  const admins = usuarios.filter((u) => u.rol === "admin");
  const cobradores = usuarios.filter((u) => u.rol === "cobrador");

  if (isPending) return <SkeletonList count={4} />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground">{usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}</p>
      </div>

      {admins.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Shield className="h-4 w-4" />
            Administradores
          </h2>
          {admins.map((u) => <UsuarioCard key={u.id} usuario={u} />)}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <User className="h-4 w-4" />
          Cobradores
        </h2>
        {cobradores.length === 0 ? (
          <EmptyState icon={UsersRound} title="Sin cobradores" description="Crea cobradores desde el módulo Cobradores." />
        ) : (
          cobradores.map((u) => <UsuarioCard key={u.id} usuario={u} />)
        )}
      </section>
    </div>
  );
}

function UsuarioCard({ usuario }: { usuario: Usuario }) {
  const queryClient = useQueryClient();
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [loadingEliminar, setLoadingEliminar] = useState(false);

  const rolConfig = ROL_CONFIG[usuario.rol] ?? { label: usuario.rol, variant: "muted" as const };

  async function toggleActivo() {
    setLoadingToggle(true);
    const res = await fetch(`/api/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !usuario.activo }),
    });
    const json = await res.json().catch(() => ({}));
    setLoadingToggle(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Error al cambiar estado");
      return;
    }
    toast.success(usuario.activo ? "Usuario desactivado" : "Usuario activado");
    void queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  }

  async function resetPassword() {
    setLoadingReset(true);
    const res = await fetch(`/api/usuarios/${usuario.id}`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setLoadingReset(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Error al enviar correo");
      return;
    }
    toast.success(`Correo de recuperacion enviado a ${usuario.email}`);
  }

  async function eliminarUsuario() {
    setLoadingEliminar(true);
    const res = await fetch(`/api/usuarios/${usuario.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setLoadingEliminar(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Error al eliminar usuario");
      return;
    }
    toast.success("Usuario eliminado");
    setConfirmEliminar(false);
    void queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  }

  const ultimoAcceso = usuario.ultimo_acceso
    ? new Date(usuario.ultimo_acceso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
    : "Nunca";

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">
              {usuario.nombre_completo || "Sin nombre"}
            </p>
            <Badge variant={rolConfig.variant}>{rolConfig.label}</Badge>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                usuario.activo
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", usuario.activo ? "bg-success" : "bg-muted-foreground")} />
              {usuario.activo ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{usuario.email || "Sin correo"}</span>
            </div>
            {usuario.telefono && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{usuario.telefono}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Ultimo acceso: {ultimoAcceso}
            </p>
          </div>
        </div>

        {/* Actions — min 44px touch target */}
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={toggleActivo}
            disabled={loadingToggle}
            title={usuario.activo ? "Desactivar usuario" : "Activar usuario"}
            className={cn(
              "flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
              usuario.activo
                ? "text-danger hover:bg-danger/10"
                : "text-success hover:bg-success/10",
            )}
          >
            {usuario.activo
              ? <UserX className="h-5 w-5" />
              : <UserCheck className="h-5 w-5" />
            }
          </button>

          <button
            onClick={resetPassword}
            disabled={loadingReset}
            title="Enviar correo de recuperacion de contrasena"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <KeyRound className="h-5 w-5" />
          </button>

          <button
            onClick={() => setConfirmEliminar(true)}
            title="Eliminar usuario"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-danger hover:bg-danger/10 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Dialog open={confirmEliminar} onClose={() => setConfirmEliminar(false)} title="Eliminar usuario">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            ¿Estas seguro de que deseas eliminar a{" "}
            <span className="font-semibold text-foreground">{usuario.nombre_completo}</span>?
            Esta accion no se puede deshacer y el usuario perdera acceso al sistema.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setConfirmEliminar(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={eliminarUsuario}
              disabled={loadingEliminar}
              className="flex-1"
            >
              {loadingEliminar ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
