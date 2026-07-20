import { createContext, useContext } from "react";

import type { AuthSession } from "../../api/types";

export interface SignUpInput {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
}

export interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateSession: (session: AuthSession) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

