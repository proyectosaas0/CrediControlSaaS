"use client";

import { createContext, useContext, useCallback, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/feedback/spinner";
import { useSyncExternalStore } from "react";

type AuthState = {
  user: { id: string; email?: string } | null;
  role: AppRole | null;
  orgId: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  orgId: null,
  loading: true,
  signOut: async () => {},
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
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

let initialized = false;

async function resolveRoleAndOrg(
  jwtClaims: Record<string, unknown>,
): Promise<{ role: AppRole | null; orgId: string | null }> {
  const role = (jwtClaims.rol as AppRole | undefined) ?? null;
  const orgId = (jwtClaims.organization_id as string | undefined) ?? null;
  if (role) return { role, orgId };

  const res = await fetch("/api/auth/me");
  if (!res.ok) return { role: null, orgId: null };
  const json = await res.json() as { data?: { actor?: { role?: string; organizationId?: string } } };
  return {
    role: (json.data?.actor?.role as AppRole | undefined) ?? null,
    orgId: json.data?.actor?.organizationId ?? null,
  };
}

async function applySession(
  session: { user: { id: string; email?: string }; access_token: string } | null,
) {
  try {
    if (session?.user) {
      const claims = parseJwtClaims(session.access_token);
      const { role, orgId } = await resolveRoleAndOrg(claims);
      authState = {
        user: { id: session.user.id, email: session.user.email },
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

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    authState = { user: null, role: null, orgId: null, loading: false };
    emitChange();
    forceUpdate((n) => n + 1);
    router.push("/login");
    router.refresh();
  }, [router]);

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
