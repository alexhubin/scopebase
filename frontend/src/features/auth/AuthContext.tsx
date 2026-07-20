import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { post, refreshAccessToken, setAccessToken } from "../../api/client";
import type { AuthSession } from "../../api/types";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateSession: (session: AuthSession) => void;
}

interface SignUpInput {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void refreshAccessToken()
      .then(setSession)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      async signIn(email, password) {
        const next = await post<AuthSession>("/auth/sign-in", { email, password });
        setAccessToken(next.access_token);
        setSession(next);
      },
      async signUp(input) {
        const next = await post<AuthSession>("/auth/sign-up", input);
        setAccessToken(next.access_token);
        setSession(next);
      },
      async signOut() {
        await post<{ message: string }>("/auth/sign-out");
        setAccessToken(null);
        setSession(null);
      },
      updateSession(next) {
        setAccessToken(next.access_token);
        setSession(next);
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

