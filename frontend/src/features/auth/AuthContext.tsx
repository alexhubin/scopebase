import { useEffect, useMemo, useState, type ReactNode } from "react";

import { post, refreshAccessToken, setAccessToken } from "../../api/client";
import type { AuthSession } from "../../api/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

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
