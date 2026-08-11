"use client";

import { createContext, useContext, useCallback, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/feedback/spinner";
import { useSyncExternalStore } from "react";

type AuthState = {
  user: { id: string; email?: string; nombreCompleto?: string | null } | null;
  role: AppRole | null;
  orgId: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
  activeOrgId: string | null;
  effectiveOrgId: string | null;
  setActiveOrgId: (id: string) => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  orgId: null,
  loading: true,
  signOut: async () => {},
  activeOrgId: null,
  effectiveOrgId: null,
  setActiveOrgId: () => {},
});

let authState: AuthState = {
  user: null,
  role: null,
  orgId: null,
  loading: true,
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Cache objects to avoid infinite loops in useSyncExternalStore
const defaultState: AuthState = { user: null, role: null, orgId: null, loading: true };

function getSnapshot(): AuthState {
  return authState;
}

function getServerSnapshot(): AuthState {
  return defaultState;
}

function parseJwtClaims(token: string): Record<string, unknown> {
  try {
    const base64url = token.split('.')[1];
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    // atob() decodes base64 into a string of raw bytes (one char per byte),
    // not UTF-8 text -- multi-byte characters (á, ñ, é...) get mangled
    // unless we re-decode those bytes as UTF-8 before parsing.
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const json = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

let initialized = false;

async function resolveRoleAndOrg(
  jwtClaims: Record<string, unknown>,
): Promise<{ role: AppRole | null; orgId: string | null; nombreCompleto: string | null }> {
  const role = (jwtClaims.rol as AppRole | undefined) ?? null;
  const orgId = (jwtClaims.organization_id as string | undefined) ?? null;
  const nombreCompleto = (jwtClaims.nombre_completo as string | undefined) ?? null;
  if (role && orgId && nombreCompleto) return { role, orgId, nombreCompleto };

  const res = await fetch("/api/auth/me");
  if (!res.ok) return { role, orgId, nombreCompleto };
  const json = await res.json() as {
    data?: { actor?: { role?: string; organizationId?: string }; profile?: { nombre_completo?: string } };
  };
  return {
    role: (json.data?.actor?.role as AppRole | undefined) ?? role,
    orgId: json.data?.actor?.organizationId ?? orgId,
    nombreCompleto: json.data?.profile?.nombre_completo ?? nombreCompleto,
  };
}

async function applySession(
  session: { user: { id: string; email?: string }; access_token: string } | null,
) {
  try {
    if (session?.user) {
      const claims = parseJwtClaims(session.access_token);
      const { role, orgId, nombreCompleto } = await resolveRoleAndOrg(claims);
      authState = {
        user: { id: session.user.id, email: session.user.email, nombreCompleto },
        role,
        orgId,
        loading: false,
      };
    } else {
      authState = { user: null, role: null, orgId: null, loading: false };
    }
  } catch {
    authState = { ...authState, loading: false };
  } finally {
    emitChange();
  }
}

function initAuth() {
  if (initialized) return;
  initialized = true;

  const supabase = createClient();

  supabase.auth.getSession().then(({ data: { session } }) => {
    void applySession(session);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    void applySession(session);
  });
}

if (typeof window !== "undefined") {
  initAuth();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [, forceUpdate] = useState(0);

  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("active-org-id") ?? null;
  });

  const setActiveOrgId = useCallback((id: string) => {
    setActiveOrgIdState(id);
    localStorage.setItem("active-org-id", id);
    document.cookie = `active-org-id=${id}; path=/; max-age=604800; SameSite=Strict`;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    authState = { user: null, role: null, orgId: null, loading: false };
    emitChange();
    forceUpdate((n) => n + 1);
    router.push("/login");
  }, [router]);

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const effectiveOrgId = state.orgId ?? activeOrgId;

  return (
    <AuthContext.Provider value={{ ...state, signOut, activeOrgId, effectiveOrgId, setActiveOrgId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
