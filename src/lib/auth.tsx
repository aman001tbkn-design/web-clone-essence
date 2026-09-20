import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readJSON, sha256, uid, writeJSON } from "@/lib/storage";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface StoredUser extends User {
  passwordHash: string;
}

const USERS_KEY = "research-ai:users";
const SESSION_KEY = "research-ai:session";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (input: { name: string; email: string; password: string }) => Promise<User>;
  signIn: (input: { email: string; password: string }) => Promise<User>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toPublic = ({ passwordHash: _hash, ...user }: StoredUser): User => user;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readJSON<{ userId: string } | null>(SESSION_KEY, null);
    if (session) {
      const users = readJSON<StoredUser[]>(USERS_KEY, []);
      const found = users.find((u) => u.id === session.userId);
      setUser(found ? toPublic(found) : null);
    }
    setLoading(false);
  }, []);

  const signUp = useCallback(async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const users = readJSON<StoredUser[]>(USERS_KEY, []);
    const normalized = normalizeEmail(email);
    if (users.some((u) => u.email === normalized)) {
      throw new Error("An account with this email already exists. Try signing in instead.");
    }
    const stored: StoredUser = {
      id: uid("user"),
      name: name.trim(),
      email: normalized,
      createdAt: new Date().toISOString(),
      passwordHash: await sha256(`${normalized}:${password}`),
    };
    writeJSON(USERS_KEY, [...users, stored]);
    writeJSON(SESSION_KEY, { userId: stored.id });
    const publicUser = toPublic(stored);
    setUser(publicUser);
    return publicUser;
  }, []);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const users = readJSON<StoredUser[]>(USERS_KEY, []);
    const normalized = normalizeEmail(email);
    const found = users.find((u) => u.email === normalized);
    const hash = await sha256(`${normalized}:${password}`);
    if (!found || found.passwordHash !== hash) {
      throw new Error("Incorrect email or password.");
    }
    writeJSON(SESSION_KEY, { userId: found.id });
    const publicUser = toPublic(found);
    setUser(publicUser);
    return publicUser;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signUp, signIn, signOut }), [user, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
